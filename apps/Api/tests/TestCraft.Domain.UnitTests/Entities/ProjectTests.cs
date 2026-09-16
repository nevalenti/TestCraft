using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class ProjectTests
{
    [Fact]
    public void Create_WithEmptyName_ThrowsDomainException()
    {
        var act = () => Project.Create("", null, UserId.New());

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Create_SetsNameDescriptionAndOwner()
    {
        var ownerId = UserId.New();

        var project = Project.Create("My Project", "A description", ownerId);

        project.Name.Should().Be("My Project");
        project.Description.Should().Be("A description");
        project.UserId.Should().Be(ownerId);
    }

    [Fact]
    public void Update_WithEmptyName_ThrowsDomainException()
    {
        var project = Project.Create("Project", null, UserId.New());

        var act = () => project.Update("", null);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Update_SetsNameAndDescription()
    {
        var project = Project.Create("Old Name", null, UserId.New());

        project.Update("New Name", "New description");

        project.Name.Should().Be("New Name");
        project.Description.Should().Be("New description");
    }

    [Fact]
    public void Delete_SetsIsDeletedAndDeletedAt()
    {
        var project = Project.Create("Project", null, UserId.New());

        project.Delete();

        project.IsDeleted.Should().BeTrue();
        project.DeletedAt.Should().NotBeNull();
    }
}
