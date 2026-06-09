using System.ComponentModel.DataAnnotations;

namespace TravelPlanService.DTOs;

public class CreateChecklistItemDto
{
    [Required, MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    public int OrderIndex { get; set; }
}
