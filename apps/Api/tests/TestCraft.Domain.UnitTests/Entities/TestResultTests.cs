using FluentAssertions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestResultTests
{
    private static TestResult MakeResult(TestResultStatus status = TestResultStatus.Passed) =>
        TestResult.Create(
            TestRunId.New(),
            TestCaseId.New(),
            status,
            notes: null,
            defectType: null,
            durationMs: null,
            executedAt: DateTimeOffset.UtcNow,
            executedById: null
        );

    [Fact]
    public void Update_SetsStatusNotesAndDefectType()
    {
        var result = MakeResult();

        result.Update(
            TestResultStatus.Failed,
            "Found a regression",
            DefectType.ProductBug,
            DateTimeOffset.UtcNow,
            null
        );

        result.Status.Should().Be(TestResultStatus.Failed);
        result.Notes.Should().Be("Found a regression");
        result.DefectType.Should().Be(DefectType.ProductBug);
    }

    [Fact]
    public void Update_WithNullNotesAndNullDefectType_ClearsFields()
    {
        var result = MakeResult(TestResultStatus.Failed);
        result.Update(
            TestResultStatus.Failed,
            "some notes",
            DefectType.AutomationBug,
            DateTimeOffset.UtcNow,
            null
        );

        result.Update(TestResultStatus.Passed, null, null, DateTimeOffset.UtcNow, null);

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
        var result = MakeResult();

        result.Update(status, null, null, DateTimeOffset.UtcNow, null);

        result.Status.Should().Be(status);
    }

    [Theory]
    [InlineData(DefectType.ProductBug)]
    [InlineData(DefectType.AutomationBug)]
    [InlineData(DefectType.EnvironmentIssue)]
    [InlineData(DefectType.ToInvestigate)]
    public void Update_AcceptsAllDefectTypeValues(DefectType defectType)
    {
        var result = MakeResult(TestResultStatus.Failed);

        result.Update(TestResultStatus.Failed, null, defectType, DateTimeOffset.UtcNow, null);

        result.DefectType.Should().Be(defectType);
    }

    [Fact]
    public void Update_ToNonFailedStatus_ClearsDefectType()
    {
        var result = MakeResult(TestResultStatus.Failed);

        result.Update(
            TestResultStatus.Blocked,
            null,
            DefectType.ProductBug,
            DateTimeOffset.UtcNow,
            null
        );

        result.DefectType.Should().BeNull();
    }

    [Fact]
    public void Update_ToUntested_ClearsExecution()
    {
        var result = TestResult.Create(
            TestRunId.New(),
            TestCaseId.New(),
            TestResultStatus.Passed,
            notes: null,
            defectType: null,
            durationMs: 1200,
            executedAt: DateTimeOffset.UtcNow,
            executedById: UserId.New()
        );

        result.Update(TestResultStatus.Untested, null, null, DateTimeOffset.UtcNow, UserId.New());

        result.ExecutedAt.Should().BeNull();
        result.ExecutedById.Should().BeNull();
        result.DurationMs.Should().BeNull();
    }

    [Fact]
    public void Update_FromUntested_StampsExecution()
    {
        var result = MakeResult(TestResultStatus.Untested);
        var now = DateTimeOffset.UtcNow;
        var userId = UserId.New();

        result.Update(TestResultStatus.Passed, null, null, now, userId);

        result.ExecutedAt.Should().Be(now);
        result.ExecutedById.Should().Be(userId);
    }

    [Fact]
    public void Update_BetweenExecutedStatuses_KeepsOriginalExecution()
    {
        var executedAt = DateTimeOffset.UtcNow.AddHours(-1);
        var executedById = UserId.New();
        var result = TestResult.Create(
            TestRunId.New(),
            TestCaseId.New(),
            TestResultStatus.Failed,
            notes: null,
            defectType: null,
            durationMs: null,
            executedAt: executedAt,
            executedById: executedById
        );

        result.Update(TestResultStatus.Passed, null, null, DateTimeOffset.UtcNow, UserId.New());

        result.ExecutedAt.Should().Be(executedAt);
        result.ExecutedById.Should().Be(executedById);
    }
}
