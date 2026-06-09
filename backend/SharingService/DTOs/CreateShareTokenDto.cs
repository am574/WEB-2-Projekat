using System.ComponentModel.DataAnnotations;

namespace SharingService.DTOs;

public class CreateShareTokenDto
{
    [Required]
    public string AccessType { get; set; } = "VIEW";

    public DateTime? ExpiresAt { get; set; }
}
