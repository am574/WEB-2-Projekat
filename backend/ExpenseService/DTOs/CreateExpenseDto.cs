using System.ComponentModel.DataAnnotations;

namespace ExpenseService.DTOs;

public class CreateExpenseDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public DateOnly Date { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }
}
