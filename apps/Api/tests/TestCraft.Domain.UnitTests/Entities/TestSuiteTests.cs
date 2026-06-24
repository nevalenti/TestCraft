using FluentAssertions;
using TestCraft.Domain.Entities;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestSuiteTests
{
    [Fact]
    public void Update_SetsNameAndDescription()
    {
        var suite = new TestSuite { Name = "Old Suite" };

        suite.Update("New Suite", "A description");

        suite.Name.Should().Be("New Suite");
        suite.Description.Should().Be("A description");
    }

    [Fact]
    public void Update_WithNullDescription_SetsDescriptionToNull()
    {
        var suite = new TestSuite { Name = "Suite", Description = "old description" };

        suite.Update("Suite", null);

        suite.Description.Should().BeNull();
    }

    [Fact]
    public void Update_OnlyChangesNameAndDescription_LeavesOtherFieldsUnchanged()
    {
        var source = "junit";
        var suite = new TestSuite { Name = "Suite", Source = source };

        suite.Update("New Name", "desc");

        suite.Source.Should().Be(source);
    }
}
