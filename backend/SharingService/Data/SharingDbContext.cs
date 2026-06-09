using Microsoft.EntityFrameworkCore;
using SharingService.Models;

namespace SharingService.Data;

public class SharingDbContext : DbContext
{
    public SharingDbContext(DbContextOptions<SharingDbContext> options) : base(options) { }

    public DbSet<ShareToken> ShareTokens => Set<ShareToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("sharing");

        modelBuilder.Entity<ShareToken>(e =>
        {
            e.ToTable("ShareTokens");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).ValueGeneratedOnAdd();
            e.Property(s => s.Token).IsRequired().HasMaxLength(500);
            e.HasIndex(s => s.Token).IsUnique();
            e.Property(s => s.AccessType).IsRequired().HasMaxLength(10);
            e.Property(s => s.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });
    }
}
