using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestSuiteTests
{
    [Fact]
    public void Create_WithEmptyName_ThrowsDomainException()
    {
        var act = () => TestSuite.Create(ProjectId.New(), "");

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Update_SetsNameAndDescription()
    {
        var suite = TestSuite.Create(ProjectId.New(), "Old Suite");

        suite.Update("New Suite", "A description");

        suite.Name.Should().Be("New Suite");
        suite.Description.Should().Be("A description");
    }

    [Fact]
    public void Update_WithNullDescription_SetsDescriptionToNull()
    {
        var suite = TestSuite.Create(ProjectId.New(), "Suite", "old description");

        suite.Update("Suite", null);

        suite.Description.Should().BeNull();
    }

    [Fact]
    public void Update_OnlyChangesNameAndDescription_LeavesOtherFieldsUnchanged()
    {
        var source = "junit";
        var suite = TestSuite.Create(ProjectId.New(), "Suite", source: source);

        suite.Update("New Name", "desc");

        suite.Source.Should().Be(source);
    }
}
