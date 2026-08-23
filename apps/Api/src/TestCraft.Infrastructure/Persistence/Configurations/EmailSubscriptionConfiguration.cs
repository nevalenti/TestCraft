using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class EmailSubscriptionConfiguration : IEntityTypeConfiguration<EmailSubscription>
{
    public void Configure(EntityTypeBuilder<EmailSubscription> builder)
    {
        builder.ToTable("email_subscriptions");

        builder.HasKey(emailSubscription => emailSubscription.Id);
        builder
            .Property(emailSubscription => emailSubscription.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder
            .Property(emailSubscription => emailSubscription.ProjectId)
            .HasColumnName("project_id");
        builder
            .Property(emailSubscription => emailSubscription.Email)
            .HasColumnName("email")
            .HasMaxLength(254)
            .IsRequired();
        builder
            .Property(emailSubscription => emailSubscription.Events)
            .HasColumnName("events")
            .IsRequired();
        builder
            .Property(emailSubscription => emailSubscription.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);
        builder
            .Property(emailSubscription => emailSubscription.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.HasIndex(emailSubscription => emailSubscription.ProjectId);

        builder.HasQueryFilter(emailSubscription => !emailSubscription.Project!.IsDeleted);
    }
}
