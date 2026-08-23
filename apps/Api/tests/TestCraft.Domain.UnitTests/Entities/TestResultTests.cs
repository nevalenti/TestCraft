using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestResultTests
{
    [Fact]
    public void Update_SetsStatusNotesAndDefectType()
    {
        var result = new TestResult { Status = TestResultStatus.Passed };

        result.Update(TestResultStatus.Failed, "Found a regression", DefectType.ProductBug);

        result.Status.Should().Be(TestResultStatus.Failed);
        result.Notes.Should().Be("Found a regression");
        result.DefectType.Should().Be(DefectType.ProductBug);
    }

    [Fact]
    public void Update_WithNullNotesAndNullDefectType_ClearsFields()
    {
        var result = new TestResult
        {
            Status = TestResultStatus.Failed,
            Notes = "some notes",
            DefectType = DefectType.AutomationBug,
        };

        result.Update(TestResultStatus.Passed, null, null);

        result.Notes.Should().BeNull();
        result.DefectType.Should().BeNull();
    }

    [Theory]
    [InlineData(TestResultStatus.Passed)]
    [InlineData(TestResultStatus.Failed)]
    [InlineData(TestResultStatus.Blocked)]
    [InlineData(TestResultStatus.Skipped)]
    public void Update_AcceptsAllStatusValues(TestResultStatus status)
    {
        var result = new TestResult { Status = TestResultStatus.Passed };

        result.Update(status, null, null);

        result.Status.Should().Be(status);
    }

    [Theory]
    [InlineData(DefectType.ProductBug)]
    [InlineData(DefectType.AutomationBug)]
    [InlineData(DefectType.EnvironmentIssue)]
    [InlineData(DefectType.ToInvestigate)]
    public void Update_AcceptsAllDefectTypeValues(DefectType defectType)
    {
        var result = new TestResult { Status = TestResultStatus.Failed };

        result.Update(TestResultStatus.Failed, null, defectType);

        result.DefectType.Should().Be(defectType);
    }
}
