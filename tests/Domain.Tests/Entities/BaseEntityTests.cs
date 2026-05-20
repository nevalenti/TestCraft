using AwesomeAssertions;

using Domain.Entities;

using Xunit;

namespace Domain.Tests.Entities;

file sealed class ConcreteEntity : BaseEntity;

public class BaseEntityTests
{
    [Fact]
    public void Id_DefaultsToNewGuid()
    {
        var entity = new ConcreteEntity();

        entity.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void CreatedAt_DefaultsToUtcNow()
    {
        var before = DateTime.UtcNow;
        var entity = new ConcreteEntity();
        var after = DateTime.UtcNow;

        entity.CreatedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(after);
    }

    [Fact]
    public void IsDeleted_DefaultsToFalse()
    {
        var entity = new ConcreteEntity();

        entity.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public void UpdatedAt_DefaultsToNull()
    {
        var entity = new ConcreteEntity();

        entity.UpdatedAt.Should().BeNull();
    }

    [Fact]
    public void DeletedAt_DefaultsToNull()
    {
        var entity = new ConcreteEntity();

        entity.DeletedAt.Should().BeNull();
    }

    [Fact]
    public void SoftDelete_SetsIsDeletedToTrue()
    {
        var entity = new ConcreteEntity();

        entity.SoftDelete();

        entity.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public void SoftDelete_SetsDeletedAt()
    {
        var before = DateTime.UtcNow;
        var entity = new ConcreteEntity();

        entity.SoftDelete();

        entity.DeletedAt.Should().NotBeNull()
            .And.BeOnOrAfter(before)
            .And.BeOnOrBefore(DateTime.UtcNow);
    }

    [Fact]
    public void SoftDelete_SetsUpdatedAt()
    {
        var before = DateTime.UtcNow;
        var entity = new ConcreteEntity();

        entity.SoftDelete();

        entity.UpdatedAt.Should().NotBeNull()
            .And.BeOnOrAfter(before)
            .And.BeOnOrBefore(DateTime.UtcNow);
    }

    [Fact]
    public void SoftDelete_WhenCalledTwice_RemainsDeleted()
    {
        var entity = new ConcreteEntity();
        entity.SoftDelete();
        var firstDeletedAt = entity.DeletedAt;

        entity.SoftDelete();

        entity.IsDeleted.Should().BeTrue();
        entity.DeletedAt.Should().BeOnOrAfter(firstDeletedAt!.Value);
    }

    [Fact]
    public void TwoEntities_HaveDifferentIds()
    {
        var a = new ConcreteEntity();
        var b = new ConcreteEntity();

        a.Id.Should().NotBe(b.Id);
    }
}