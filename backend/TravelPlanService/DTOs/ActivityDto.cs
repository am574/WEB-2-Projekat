namespace TravelPlanService.DTOs;

public class ActivityDto
{
    public Guid Id { get; set; }
    public Guid TravelPlanId { get; set; }
    public Guid? DestinationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public TimeOnly? Time { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
