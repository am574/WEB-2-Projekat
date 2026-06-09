namespace TravelPlanService.Models;

public class Destination
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TravelPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateOnly ArrivalDate { get; set; }
    public DateOnly DepartureDate { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public TravelPlan TravelPlan { get; set; } = null!;
    public List<Activity> Activities { get; set; } = new();
}
