using Domain.Entities;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Project> Projects { get; set; }
    public DbSet<TestSuite> TestSuites { get; set; }
    public DbSet<TestCase> TestCases { get; set; }
    public DbSet<TestCaseStep> TestCaseSteps { get; set; }
    public DbSet<TestRun> TestRuns { get; set; }
    public DbSet<TestResult> TestResults { get; set; }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Property(nameof(BaseEntity.UpdatedAt)).CurrentValue = now;
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}