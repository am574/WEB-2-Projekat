using Microsoft.EntityFrameworkCore;
using TravelPlanService.Models;

namespace TravelPlanService.Data;

public class PlanningDbContext : DbContext
{
    public PlanningDbContext(DbContextOptions<PlanningDbContext> options) : base(options) { }

    public DbSet<TravelPlan> TravelPlans => Set<TravelPlan>();
    public DbSet<Destination> Destinations => Set<Destination>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<ChecklistItem> ChecklistItems => Set<ChecklistItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("planning");

        modelBuilder.Entity<TravelPlan>(e =>
        {
            e.ToTable("TravelPlans");
            e.HasKey(t => t.Id);
            e.Property(t => t.Id).ValueGeneratedOnAdd();
            e.Property(t => t.Name).IsRequired().HasMaxLength(200);
            e.Property(t => t.Description).HasMaxLength(1000);
            e.Property(t => t.Budget).HasColumnType("decimal(18,2)");
            e.Property(t => t.Notes).HasMaxLength(2000);
            e.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.Property(t => t.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Destination>(e =>
        {
            e.ToTable("Destinations");
            e.HasKey(d => d.Id);
            e.Property(d => d.Id).ValueGeneratedOnAdd();
            e.Property(d => d.Name).IsRequired().HasMaxLength(200);
            e.Property(d => d.Location).IsRequired().HasMaxLength(300);
            e.Property(d => d.Description).HasMaxLength(1000);
            e.Property(d => d.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasOne(d => d.TravelPlan)
             .WithMany(t => t.Destinations)
             .HasForeignKey(d => d.TravelPlanId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Activity>(e =>
        {
            e.ToTable("Activities");
            e.HasKey(a => a.Id);
            e.Property(a => a.Id).ValueGeneratedOnAdd();
            e.Property(a => a.Name).IsRequired().HasMaxLength(200);
            e.Property(a => a.Location).HasMaxLength(300);
            e.Property(a => a.Description).HasMaxLength(1000);
            e.Property(a => a.EstimatedCost).HasColumnType("decimal(18,2)");
            e.Property(a => a.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Planned");
            e.Property(a => a.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasOne(a => a.TravelPlan)
             .WithMany(t => t.Activities)
             .HasForeignKey(a => a.TravelPlanId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Destination)
             .WithMany(d => d.Activities)
             .HasForeignKey(a => a.DestinationId)
             .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ChecklistItem>(e =>
        {
            e.ToTable("ChecklistItems");
            e.HasKey(c => c.Id);
            e.Property(c => c.Id).ValueGeneratedOnAdd();
            e.Property(c => c.Name).IsRequired().HasMaxLength(300);
            e.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasOne(c => c.TravelPlan)
             .WithMany(t => t.ChecklistItems)
             .HasForeignKey(c => c.TravelPlanId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
