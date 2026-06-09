using System.ComponentModel.DataAnnotations;

namespace TravelPlanService.DTOs;

public class CreateTravelPlanDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Budget { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}
