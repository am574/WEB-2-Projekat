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
public class DestinationsController : ControllerBase
{
    private readonly PlanningDbContext _db;

    public DestinationsController(PlanningDbContext db) => _db = db;

    [HttpGet("api/travel-plans/{planId:guid}/destinations")]
    public async Task<IActionResult> GetAll(Guid planId)
    {
        if (!await PlanBelongsToUser(planId)) return NotFound();

        var destinations = await _db.Destinations
            .Where(d => d.TravelPlanId == planId)
            .Select(d => MapToDto(d))
            .ToListAsync();

        return Ok(destinations);
    }

    [HttpPost("api/travel-plans/{planId:guid}/destinations")]
    public async Task<IActionResult> Create(Guid planId, [FromBody] CreateDestinationDto dto)
    {
        if (!await PlanBelongsToUser(planId)) return NotFound();

        if (dto.DepartureDate < dto.ArrivalDate)
            return BadRequest(new { message = "Departure date cannot be before arrival date." });

        var destination = new Destination
        {
            TravelPlanId = planId,
            Name = dto.Name,
            Location = dto.Location,
            ArrivalDate = dto.ArrivalDate,
            DepartureDate = dto.DepartureDate,
            Description = dto.Description
        };

        _db.Destinations.Add(destination);
        await _db.SaveChangesAsync();

        return CreatedAtAction(null, MapToDto(destination));
    }

    [HttpPut("api/destinations/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateDestinationDto dto)
    {
        var destination = await GetOwnedDestination(id);
        if (destination == null) return NotFound();

        if (dto.DepartureDate < dto.ArrivalDate)
            return BadRequest(new { message = "Departure date cannot be before arrival date." });

        destination.Name = dto.Name;
        destination.Location = dto.Location;
        destination.ArrivalDate = dto.ArrivalDate;
        destination.DepartureDate = dto.DepartureDate;
        destination.Description = dto.Description;

        await _db.SaveChangesAsync();
        return Ok(MapToDto(destination));
    }

    [HttpDelete("api/destinations/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var destination = await GetOwnedDestination(id);
        if (destination == null) return NotFound();

        _db.Destinations.Remove(destination);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> PlanBelongsToUser(Guid planId)
    {
        var userId = GetUserId();
        return await _db.TravelPlans.AnyAsync(p => p.Id == planId && p.UserId == userId);
    }

    private async Task<Destination?> GetOwnedDestination(Guid id)
    {
        var userId = GetUserId();
        return await _db.Destinations
            .Include(d => d.TravelPlan)
            .FirstOrDefaultAsync(d => d.Id == id && d.TravelPlan.UserId == userId);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static DestinationDto MapToDto(Destination d) => new()
    {
        Id = d.Id,
        TravelPlanId = d.TravelPlanId,
        Name = d.Name,
        Location = d.Location,
        ArrivalDate = d.ArrivalDate,
        DepartureDate = d.DepartureDate,
        Description = d.Description,
        CreatedAt = d.CreatedAt
    };
}
