namespace SharingService.Models;

public class ShareToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TravelPlanId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string AccessType { get; set; } = "VIEW";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
}
