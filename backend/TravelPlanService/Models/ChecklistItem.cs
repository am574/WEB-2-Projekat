namespace TravelPlanService.Models;

public class ChecklistItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TravelPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public int OrderIndex { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public TravelPlan TravelPlan { get; set; } = null!;
}
