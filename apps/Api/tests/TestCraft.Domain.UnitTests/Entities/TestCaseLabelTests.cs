using FluentAssertions;

using TestCraft.Domain.Entities;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestCaseLabelTests
{
    [Fact]
    public void Create_SetsIds()
    {
        var testCaseId = TestCaseId.New();
        var labelId = LabelId.New();

        var testCaseLabel = TestCaseLabel.Create(testCaseId, labelId);

        testCaseLabel.TestCaseId.Should().Be(testCaseId);
        testCaseLabel.LabelId.Should().Be(labelId);
    }
}
