namespace SharingService.DTOs;

public class ShareTokenDto
{
    public Guid Id { get; set; }
    public Guid TravelPlanId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string AccessType { get; set; } = string.Empty;
    public string? QrCodeBase64 { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
