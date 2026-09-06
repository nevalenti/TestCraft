using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects");

        builder.ConfigureGeneratedId(project => project.Id);

        builder
            .Property(project => project.Name)
            .HasColumnName("name")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(project => project.Description).HasColumnName("description");

        builder.Property(project => project.UserId).HasColumnName("user_id");

        builder.ConfigureAuditTimestamps();

        builder.ConfigureSoftDelete();

        builder.HasIndex(project => project.UserId);

        builder.HasIndex(project => new { project.UserId, project.Name }).IsUnique();

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

        builder
            .HasMany(project => project.NotificationDeliveries)
            .WithOne(delivery => delivery.Project)
            .HasForeignKey(delivery => delivery.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
