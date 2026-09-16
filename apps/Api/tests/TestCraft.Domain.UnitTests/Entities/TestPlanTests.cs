using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestPlanTests
{
    [Fact]
    public void Create_WithEmptyName_ThrowsDomainException()
    {
        var act = () => TestPlan.Create("", null, ProjectId.New());

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Update_WithEmptyName_ThrowsDomainException()
    {
        var plan = TestPlan.Create("Plan", null, ProjectId.New());

        var act = () => plan.Update("", null);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Update_SetsNameAndDescription()
    {
        var plan = TestPlan.Create("Old Name", null, ProjectId.New());

        plan.Update("New Name", "New description");

        plan.Name.Should().Be("New Name");
        plan.Description.Should().Be("New description");
    }
}
