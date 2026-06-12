using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TravelPlanService.Data;
using TravelPlanService.DTOs;
using TravelPlanService.Models;

namespace TravelPlanService.Controllers;

[ApiController]
[Route("api/travel-plans")]
[Authorize]
public class TravelPlansController : ControllerBase
{
    private readonly PlanningDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    public TravelPlansController(PlanningDbContext db, IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        var plans = await _db.TravelPlans
            .Where(p => p.UserId == userId)
            .Select(p => new TravelPlanDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.Name,
                Description = p.Description,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                Budget = p.Budget,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return Ok(plans);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = GetUserId();
        var plan = await _db.TravelPlans
            .Include(p => p.Destinations)
            .Include(p => p.Activities)
            .Include(p => p.ChecklistItems)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

        if (plan == null) return NotFound();

        return Ok(MapToDto(plan));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTravelPlanDto dto)
    {
        if (dto.EndDate < dto.StartDate)
            return BadRequest(new { message = "End date cannot be before start date." });

        var userId = GetUserId();
        var plan = new TravelPlan
        {
            UserId = userId,
            Name = dto.Name,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Budget = dto.Budget,
            Notes = dto.Notes
        };

        _db.TravelPlans.Add(plan);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, MapToDto(plan));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTravelPlanDto dto)
    {
        if (dto.EndDate < dto.StartDate)
            return BadRequest(new { message = "End date cannot be before start date." });

        var userId = GetUserId();
        var plan = await _db.TravelPlans.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (plan == null) return NotFound();

        plan.Name = dto.Name;
        plan.Description = dto.Description;
        plan.StartDate = dto.StartDate;
        plan.EndDate = dto.EndDate;
        plan.Budget = dto.Budget;
        plan.Notes = dto.Notes;
        plan.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(MapToDto(plan));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        var plan = await _db.TravelPlans.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (plan == null) return NotFound();

        _db.TravelPlans.Remove(plan);
        await _db.SaveChangesAsync();

        // Cascade delete u ostalim servisima
        var client = _httpClientFactory.CreateClient();
        var token = Request.Headers["Authorization"].ToString();

        _ = client.DeleteAsync($"{_config["ExpenseServiceUrl"]}/api/expenses/by-plan/{id}");
        _ = client.DeleteAsync($"{_config["SharingServiceUrl"]}/api/sharing/by-plan/{id}");

        return NoContent();
    }

    [HttpPut("{id:guid}/by-token")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateByToken(Guid id, [FromBody] UpdateByTokenDto dto)
    {
        var plan = await _db.TravelPlans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan == null) return NotFound();

        plan.Name = dto.Name;
        plan.Description = dto.Description;
        plan.Notes = dto.Notes;
        plan.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(MapToDto(plan));
    }

    [HttpGet("{id:guid}/public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByIdPublic(Guid id)
    {
        var plan = await _db.TravelPlans
            .Include(p => p.Destinations)
            .Include(p => p.Activities)
            .Include(p => p.ChecklistItems)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (plan == null) return NotFound();
        return Ok(MapToDto(plan));
    }

    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllAdmin()
    {
        var plans = await _db.TravelPlans
            .Select(p => new TravelPlanDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.Name,
                Description = p.Description,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                Budget = p.Budget,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return Ok(plans);
    }

    [HttpDelete("admin/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAdmin(Guid id)
    {
        var plan = await _db.TravelPlans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan == null) return NotFound();

        _db.TravelPlans.Remove(plan);
        await _db.SaveChangesAsync();

        var client = _httpClientFactory.CreateClient();
        _ = client.DeleteAsync($"{_config["ExpenseServiceUrl"]}/api/expenses/by-plan/{id}");
        _ = client.DeleteAsync($"{_config["SharingServiceUrl"]}/api/sharing/by-plan/{id}");

        return NoContent();
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static TravelPlanDto MapToDto(TravelPlan p) => new()
    {
        Id = p.Id,
        UserId = p.UserId,
        Name = p.Name,
        Description = p.Description,
        StartDate = p.StartDate,
        EndDate = p.EndDate,
        Budget = p.Budget,
        Notes = p.Notes,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
        Destinations = p.Destinations.Select(d => new DestinationDto
        {
            Id = d.Id,
            TravelPlanId = d.TravelPlanId,
            Name = d.Name,
            Location = d.Location,
            ArrivalDate = d.ArrivalDate,
            DepartureDate = d.DepartureDate,
            Description = d.Description,
            CreatedAt = d.CreatedAt
        }).ToList(),
        Activities = p.Activities.Select(a => new ActivityDto
        {
            Id = a.Id,
            TravelPlanId = a.TravelPlanId,
            DestinationId = a.DestinationId,
            Name = a.Name,
            Date = a.Date,
            Time = a.Time,
            Location = a.Location,
            Description = a.Description,
            EstimatedCost = a.EstimatedCost,
            Status = a.Status,
            CreatedAt = a.CreatedAt
        }).ToList(),
        ChecklistItems = p.ChecklistItems.OrderBy(c => c.OrderIndex).Select(c => new ChecklistItemDto
        {
            Id = c.Id,
            TravelPlanId = c.TravelPlanId,
            Name = c.Name,
            IsCompleted = c.IsCompleted,
            OrderIndex = c.OrderIndex,
            CreatedAt = c.CreatedAt
        }).ToList()
    };
}
