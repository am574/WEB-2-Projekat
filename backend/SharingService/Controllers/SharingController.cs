using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QRCoder;
using SharingService.Data;
using SharingService.DTOs;
using SharingService.Models;
using System.Security.Claims;
using System.Text.Json;

namespace SharingService.Controllers;

[ApiController]
[Route("api/sharing")]
public class SharingController : ControllerBase
{
    private readonly SharingDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    private static readonly HashSet<string> ValidAccessTypes = new() { "VIEW", "EDIT" };

    public SharingController(SharingDbContext db, IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    [HttpGet("/api/travel-plans/{planId:guid}/share")]
    [Authorize]
    public async Task<IActionResult> GetShareTokensForPlan(Guid planId)
    {
        if (!await PlanBelongsToUser(planId))
            return NotFound();

        var tokens = await _db.ShareTokens
            .Where(s => s.TravelPlanId == planId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(tokens.Select(s => new ShareTokenDto
        {
            Id = s.Id,
            TravelPlanId = s.TravelPlanId,
            Token = s.Token,
            AccessType = s.AccessType,
            CreatedAt = s.CreatedAt,
            ExpiresAt = s.ExpiresAt
        }));
    }

    [HttpPost("/api/travel-plans/{planId:guid}/share")]
    [Authorize]
    public async Task<IActionResult> CreateShareToken(Guid planId, [FromBody] CreateShareTokenDto dto)
    {
        if (!ValidAccessTypes.Contains(dto.AccessType))
            return BadRequest(new { message = "AccessType must be VIEW or EDIT." });

        if (!await PlanBelongsToUser(planId))
            return NotFound();

        var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        var shareToken = new ShareToken
        {
            TravelPlanId = planId,
            Token = token,
            AccessType = dto.AccessType,
            ExpiresAt = dto.ExpiresAt
        };

        _db.ShareTokens.Add(shareToken);
        await _db.SaveChangesAsync();

        var shareUrl = $"{_config["FrontendUrl"]}/shared/{token}";
        var qrBase64 = GenerateQrCode(shareUrl);

        return Ok(new ShareTokenDto
        {
            Id = shareToken.Id,
            TravelPlanId = shareToken.TravelPlanId,
            Token = shareToken.Token,
            AccessType = shareToken.AccessType,
            QrCodeBase64 = qrBase64,
            CreatedAt = shareToken.CreatedAt,
            ExpiresAt = shareToken.ExpiresAt
        });
    }

    [HttpGet("/api/shared/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSharedPlan(string token)
    {
        var shareToken = await _db.ShareTokens.FirstOrDefaultAsync(s => s.Token == token);
        if (shareToken == null)
            return NotFound(new { message = "Invalid or expired token." });

        if (shareToken.ExpiresAt.HasValue && shareToken.ExpiresAt < DateTime.UtcNow)
            return Gone();

        var client = _httpClientFactory.CreateClient();
        var response = await client.GetAsync(
            $"{_config["TravelPlanServiceUrl"]}/api/travel-plans/{shareToken.TravelPlanId}/public");

        if (!response.IsSuccessStatusCode)
            return NotFound(new { message = "Plan not found." });

        var planJson = await response.Content.ReadAsStringAsync();
        var plan = JsonSerializer.Deserialize<JsonElement>(planJson);

        return Ok(new
        {
            accessType = shareToken.AccessType,
            plan
        });
    }

    [HttpPut("/api/shared/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateSharedPlan(string token, [FromBody] JsonElement body)
    {
        var shareToken = await _db.ShareTokens.FirstOrDefaultAsync(s => s.Token == token);
        if (shareToken == null)
            return NotFound(new { message = "Invalid token." });

        if (shareToken.ExpiresAt.HasValue && shareToken.ExpiresAt < DateTime.UtcNow)
            return Gone();

        if (shareToken.AccessType != "EDIT")
            return StatusCode(403, new { message = "This share link is view-only." });

        var client = _httpClientFactory.CreateClient();
        var content = new StringContent(
            body.ToString(),
            System.Text.Encoding.UTF8,
            "application/json");

        var response = await client.PutAsync(
            $"{_config["TravelPlanServiceUrl"]}/api/travel-plans/{shareToken.TravelPlanId}/by-token",
            content);

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { message = "Failed to update plan." });

        var planJson = await response.Content.ReadAsStringAsync();
        return Ok(JsonSerializer.Deserialize<JsonElement>(planJson));
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var shareToken = await _db.ShareTokens.FindAsync(id);
        if (shareToken == null) return NotFound();

        if (!await PlanBelongsToUser(shareToken.TravelPlanId))
            return Forbid();

        _db.ShareTokens.Remove(shareToken);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Interno - poziva TravelPlanService pri brisanju plana
    [HttpDelete("by-plan/{planId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteByPlan(Guid planId)
    {
        var tokens = await _db.ShareTokens.Where(s => s.TravelPlanId == planId).ToListAsync();
        _db.ShareTokens.RemoveRange(tokens);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> PlanBelongsToUser(Guid planId)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer",
                    Request.Headers["Authorization"].ToString().Replace("Bearer ", ""));
            var response = await client.GetAsync($"{_config["TravelPlanServiceUrl"]}/api/travel-plans/{planId}");
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    private static string GenerateQrCode(string url)
    {
        using var qrGenerator = new QRCodeGenerator();
        var qrData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrData);
        var bytes = qrCode.GetGraphic(10);
        return Convert.ToBase64String(bytes);
    }

    private IActionResult Gone() =>
        StatusCode(410, new { message = "This share link has expired." });
}
