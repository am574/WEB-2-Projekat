using System.ComponentModel.DataAnnotations;

namespace TravelPlanService.DTOs;

public class CreateActivityDto
{
    public Guid? DestinationId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public DateOnly Date { get; set; }

    public TimeOnly? Time { get; set; }

    [MaxLength(300)]
    public string? Location { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? EstimatedCost { get; set; }

    public string Status { get; set; } = "Planned";
}
