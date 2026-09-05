using System.Linq.Expressions;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

/// <summary>Shared column conventions reused across <see cref="IEntityTypeConfiguration{TEntity}"/> implementations.</summary>
public static class EntityTypeBuilderExtensions
{
    /// <summary>Configures a database-generated primary key column named "id".</summary>
    public static EntityTypeBuilder<TEntity> ConfigureGeneratedId<TEntity, TId>(
        this EntityTypeBuilder<TEntity> builder,
        Expression<Func<TEntity, TId>> idSelector
    )
        where TEntity : class
    {
        var keyExpression = Expression.Lambda<Func<TEntity, object?>>(
            Expression.Convert(idSelector.Body, typeof(object)),
            idSelector.Parameters[0]
        );

        builder.HasKey(keyExpression);
        builder.Property(idSelector).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");

        return builder;
    }

    /// <summary>Configures "created_at"/"updated_at" columns defaulting to the current time.</summary>
    public static EntityTypeBuilder<TEntity> ConfigureAuditTimestamps<TEntity>(
        this EntityTypeBuilder<TEntity> builder
    )
        where TEntity : class, IAuditableEntity
    {
        builder
            .Property(entity => entity.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(entity => entity.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");

        return builder;
    }

    /// <summary>Configures "is_deleted"/"deleted_at" columns and filters soft-deleted rows out of queries.</summary>
    public static EntityTypeBuilder<TEntity> ConfigureSoftDelete<TEntity>(
        this EntityTypeBuilder<TEntity> builder
    )
        where TEntity : class, ISoftDeletableEntity
    {
        builder
            .Property(entity => entity.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);
        builder.Property(entity => entity.DeletedAt).HasColumnName("deleted_at");

        builder.HasQueryFilter(entity => !entity.IsDeleted);

        return builder;
    }
}
