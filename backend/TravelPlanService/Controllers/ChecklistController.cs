using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TravelPlanService.Data;
using TravelPlanService.DTOs;
using TravelPlanService.Models;

namespace TravelPlanService.Controllers;

[ApiController]
[Authorize]
public class ChecklistController : ControllerBase
{
    private readonly PlanningDbContext _db;

    public ChecklistController(PlanningDbContext db) => _db = db;

    [HttpGet("api/travel-plans/{planId:guid}/checklist")]
    public async Task<IActionResult> GetAll(Guid planId)
    {
        if (!await PlanBelongsToUser(planId)) return NotFound();

        var items = await _db.ChecklistItems
            .Where(c => c.TravelPlanId == planId)
            .OrderBy(c => c.OrderIndex)
            .Select(c => MapToDto(c))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("api/travel-plans/{planId:guid}/checklist")]
    public async Task<IActionResult> Create(Guid planId, [FromBody] CreateChecklistItemDto dto)
    {
        if (!await PlanBelongsToUser(planId)) return NotFound();

        var item = new ChecklistItem
        {
            TravelPlanId = planId,
            Name = dto.Name,
            OrderIndex = dto.OrderIndex
        };

        _db.ChecklistItems.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(null, MapToDto(item));
    }

    [HttpPut("api/checklist/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateChecklistItemDto dto)
    {
        var item = await GetOwnedItem(id);
        if (item == null) return NotFound();

        item.Name = dto.Name;
        item.OrderIndex = dto.OrderIndex;

        await _db.SaveChangesAsync();
        return Ok(MapToDto(item));
    }

    [HttpPatch("api/checklist/{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        var item = await GetOwnedItem(id);
        if (item == null) return NotFound();

        item.IsCompleted = !item.IsCompleted;
        await _db.SaveChangesAsync();
        return Ok(MapToDto(item));
    }

    [HttpDelete("api/checklist/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await GetOwnedItem(id);
        if (item == null) return NotFound();

        _db.ChecklistItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> PlanBelongsToUser(Guid planId)
    {
        var userId = GetUserId();
        return await _db.TravelPlans.AnyAsync(p => p.Id == planId && p.UserId == userId);
    }

    private async Task<ChecklistItem?> GetOwnedItem(Guid id)
    {
        var userId = GetUserId();
        return await _db.ChecklistItems
            .Include(c => c.TravelPlan)
            .FirstOrDefaultAsync(c => c.Id == id && c.TravelPlan.UserId == userId);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static ChecklistItemDto MapToDto(ChecklistItem c) => new()
    {
        Id = c.Id,
        TravelPlanId = c.TravelPlanId,
        Name = c.Name,
        IsCompleted = c.IsCompleted,
        OrderIndex = c.OrderIndex,
        CreatedAt = c.CreatedAt
    };
}
