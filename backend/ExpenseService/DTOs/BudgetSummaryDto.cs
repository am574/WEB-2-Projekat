namespace ExpenseService.DTOs;

public class BudgetSummaryDto
{
    public Guid TravelPlanId { get; set; }
    public decimal PlannedBudget { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal Remaining { get; set; }
    public Dictionary<string, decimal> ByCategory { get; set; } = new();
}
