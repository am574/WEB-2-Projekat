using System.ComponentModel.DataAnnotations;

namespace TravelPlanService.DTOs;

public class UpdateByTokenDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}
