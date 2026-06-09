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
public class ActivitiesController : ControllerBase
{
    private readonly PlanningDbContext _db;

    public ActivitiesController(PlanningDbContext db) => _db = db;

    [HttpGet("api/travel-plans/{planId:guid}/activities")]
    public async Task<IActionResult> GetAll(Guid planId)
    {
        if (!await PlanBelongsToUser(planId)) return NotFound();

        var activities = await _db.Activities
            .Where(a => a.TravelPlanId == planId)
            .OrderBy(a => a.Date).ThenBy(a => a.Time)
            .Select(a => MapToDto(a))
            .ToListAsync();

        return Ok(activities);
    }

    [HttpPost("api/travel-plans/{planId:guid}/activities")]
    public async Task<IActionResult> Create(Guid planId, [FromBody] CreateActivityDto dto)
    {
        if (!await PlanBelongsToUser(planId)) return NotFound();

        var activity = new Activity
        {
            TravelPlanId = planId,
            DestinationId = dto.DestinationId,
            Name = dto.Name,
            Date = dto.Date,
            Time = dto.Time,
            Location = dto.Location,
            Description = dto.Description,
            EstimatedCost = dto.EstimatedCost,
            Status = dto.Status
        };

        _db.Activities.Add(activity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(null, MapToDto(activity));
    }

    [HttpPut("api/activities/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateActivityDto dto)
    {
        var activity = await GetOwnedActivity(id);
        if (activity == null) return NotFound();

        activity.DestinationId = dto.DestinationId;
        activity.Name = dto.Name;
        activity.Date = dto.Date;
        activity.Time = dto.Time;
        activity.Location = dto.Location;
        activity.Description = dto.Description;
        activity.EstimatedCost = dto.EstimatedCost;
        activity.Status = dto.Status;

        await _db.SaveChangesAsync();
        return Ok(MapToDto(activity));
    }

    [HttpDelete("api/activities/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var activity = await GetOwnedActivity(id);
        if (activity == null) return NotFound();

        _db.Activities.Remove(activity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> PlanBelongsToUser(Guid planId)
    {
        var userId = GetUserId();
        return await _db.TravelPlans.AnyAsync(p => p.Id == planId && p.UserId == userId);
    }

    private async Task<Activity?> GetOwnedActivity(Guid id)
    {
        var userId = GetUserId();
        return await _db.Activities
            .Include(a => a.TravelPlan)
            .FirstOrDefaultAsync(a => a.Id == id && a.TravelPlan.UserId == userId);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static ActivityDto MapToDto(Activity a) => new()
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
    };
}
