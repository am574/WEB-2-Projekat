using ExpenseService.Data;
using ExpenseService.DTOs;
using ExpenseService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace ExpenseService.Controllers;

[ApiController]
[Route("api/expenses")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly ExpenseDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    private static readonly HashSet<string> ValidCategories =
        new() { "Transport", "Accommodation", "Food", "Tickets", "Shopping", "Other" };

    public ExpensesController(ExpenseDbContext db, IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    [HttpGet("/api/travel-plans/{planId:guid}/expenses")]
    public async Task<IActionResult> GetAll(Guid planId)
    {
        if (!await PlanBelongsToUser(planId)) return NotFound();

        var expenses = await _db.Expenses
            .Where(e => e.TravelPlanId == planId)
            .OrderBy(e => e.Date)
            .Select(e => MapToDto(e))
            .ToListAsync();

        return Ok(expenses);
    }

    [HttpPost("/api/travel-plans/{planId:guid}/expenses")]
    public async Task<IActionResult> Create(Guid planId, [FromBody] CreateExpenseDto dto)
    {
        if (!await PlanBelongsToUser(planId)) return NotFound();
        if (!ValidCategories.Contains(dto.Category))
            return BadRequest(new { message = "Invalid category." });

        var expense = new Expense
        {
            TravelPlanId = planId,
            Name = dto.Name,
            Category = dto.Category,
            Amount = dto.Amount,
            Date = dto.Date,
            Description = dto.Description
        };

        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();
        return CreatedAtAction(null, MapToDto(expense));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateExpenseDto dto)
    {
        var expense = await GetOwnedExpense(id);
        if (expense == null) return NotFound();
        if (!ValidCategories.Contains(dto.Category))
            return BadRequest(new { message = "Invalid category." });

        expense.Name = dto.Name;
        expense.Category = dto.Category;
        expense.Amount = dto.Amount;
        expense.Date = dto.Date;
        expense.Description = dto.Description;

        await _db.SaveChangesAsync();
        return Ok(MapToDto(expense));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var expense = await GetOwnedExpense(id);
        if (expense == null) return NotFound();

        _db.Expenses.Remove(expense);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Poziva TravelPlanService za budžet, pa računa ostatak
    [HttpGet("/api/travel-plans/{planId:guid}/budget-summary")]
    public async Task<IActionResult> GetBudgetSummary(Guid planId)
    {
        if (!await PlanBelongsToUser(planId)) return NotFound();

        var expenses = await _db.Expenses.Where(e => e.TravelPlanId == planId).ToListAsync();
        var totalSpent = expenses.Sum(e => e.Amount);
        var byCategory = expenses.GroupBy(e => e.Category)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

        // Dohvati budget iz TravelPlanService
        decimal plannedBudget = 0;
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer",
                    Request.Headers["Authorization"].ToString().Replace("Bearer ", ""));
            var response = await client.GetAsync($"{_config["TravelPlanServiceUrl"]}/api/travel-plans/{planId}");
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var plan = JsonSerializer.Deserialize<JsonElement>(content);
                plannedBudget = plan.GetProperty("budget").GetDecimal();
            }
        }
        catch { }

        return Ok(new BudgetSummaryDto
        {
            TravelPlanId = planId,
            PlannedBudget = plannedBudget,
            TotalSpent = totalSpent,
            Remaining = plannedBudget - totalSpent,
            ByCategory = byCategory
        });
    }

    // Interno - poziva TravelPlanService pri brisanju plana
    [HttpDelete("by-plan/{planId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteByPlan(Guid planId)
    {
        var expenses = await _db.Expenses.Where(e => e.TravelPlanId == planId).ToListAsync();
        _db.Expenses.RemoveRange(expenses);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> PlanBelongsToUser(Guid planId)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer",
                    Request.Headers["Authorization"].ToString().Replace("Bearer ", ""));
            var response = await client.GetAsync($"{_config["TravelPlanServiceUrl"]}/api/travel-plans/{planId}");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private async Task<Expense?> GetOwnedExpense(Guid id)
    {
        var userId = GetUserId();
        var expense = await _db.Expenses.FindAsync(id);
        if (expense == null) return null;
        if (!await PlanBelongsToUser(expense.TravelPlanId)) return null;
        return expense;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static ExpenseDto MapToDto(Expense e) => new()
    {
        Id = e.Id,
        TravelPlanId = e.TravelPlanId,
        Name = e.Name,
        Category = e.Category,
        Amount = e.Amount,
        Date = e.Date,
        Description = e.Description,
        CreatedAt = e.CreatedAt
    };
}
