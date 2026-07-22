using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects");

        builder.HasKey(project => project.Id);
        builder
            .Property(project => project.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder
            .Property(project => project.Name)
            .HasColumnName("name")
            .HasMaxLength(255)
            .IsRequired();
        builder.Property(project => project.Description).HasColumnName("description");
        builder.Property(project => project.UserId).HasColumnName("user_id");
        builder
            .Property(project => project.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(project => project.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(project => project.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);
        builder.Property(project => project.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(project => project.UserId);
        builder.HasIndex(project => new { project.UserId, project.Name }).IsUnique();

        builder.HasQueryFilter(project => !project.IsDeleted);

        builder
            .HasMany(project => project.TestSuites)
            .WithOne(testSuite => testSuite.Project)
            .HasForeignKey(testSuite => testSuite.ProjectId);
        builder
            .HasMany(project => project.TestRuns)
            .WithOne(testRun => testRun.Project)
            .HasForeignKey(testRun => testRun.ProjectId);
        builder
            .HasMany(project => project.Labels)
            .WithOne(label => label.Project)
            .HasForeignKey(label => label.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        builder
            .HasMany(project => project.TestPlans)
            .WithOne(tp => tp.Project)
            .HasForeignKey(tp => tp.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        builder
            .HasMany(project => project.ApiTokens)
            .WithOne(apiToken => apiToken.Project)
            .HasForeignKey(apiToken => apiToken.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        builder
            .HasMany(project => project.WebhookSubscriptions)
            .WithOne(webhookSubscription => webhookSubscription.Project)
            .HasForeignKey(webhookSubscription => webhookSubscription.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        builder
            .HasMany(project => project.EmailSubscriptions)
            .WithOne(emailSubscription => emailSubscription.Project)
            .HasForeignKey(emailSubscription => emailSubscription.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        builder
            .HasMany(project => project.Members)
            .WithOne(projectMember => projectMember.Project)
            .HasForeignKey(projectMember => projectMember.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
