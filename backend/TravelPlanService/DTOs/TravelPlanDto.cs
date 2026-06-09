namespace TravelPlanService.DTOs;

public class TravelPlanDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal Budget { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<DestinationDto> Destinations { get; set; } = new();
    public List<ActivityDto> Activities { get; set; } = new();
    public List<ChecklistItemDto> ChecklistItems { get; set; } = new();
}
