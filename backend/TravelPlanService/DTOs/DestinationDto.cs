namespace TravelPlanService.DTOs;

public class DestinationDto
{
    public Guid Id { get; set; }
    public Guid TravelPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateOnly ArrivalDate { get; set; }
    public DateOnly DepartureDate { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
