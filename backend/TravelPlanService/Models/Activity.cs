namespace TravelPlanService.Models;

public class Activity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TravelPlanId { get; set; }
    public Guid? DestinationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public TimeOnly? Time { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string Status { get; set; } = "Planned";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public TravelPlan TravelPlan { get; set; } = null!;
    public Destination? Destination { get; set; }
}
