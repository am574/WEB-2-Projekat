using System.ComponentModel.DataAnnotations;

namespace TravelPlanService.DTOs;

public class CreateDestinationDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string Location { get; set; } = string.Empty;

    [Required]
    public DateOnly ArrivalDate { get; set; }

    [Required]
    public DateOnly DepartureDate { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }
}
