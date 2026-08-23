using FluentAssertions;

using TestCraft.Application.Features.Import;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.UnitTests.Import;

public class AllureParserTests
{
    [Theory]
    [InlineData("passed", TestResultStatus.Passed)]
    [InlineData("failed", TestResultStatus.Failed)]
    [InlineData("broken", TestResultStatus.Failed)]
    [InlineData("skipped", TestResultStatus.Skipped)]
    [InlineData("unknown", TestResultStatus.Blocked)]
    [InlineData(null, TestResultStatus.Blocked)]
    public void Parse_MapsAllureStatusStrings(string? allureStatus, TestResultStatus expected)
    {
        var results = new List<AllureResultItem>
        {
            new() { Name = "Case", Status = allureStatus },
        };

        var cases = AllureParser.Parse(results);

        cases.Single().Status.Should().Be(expected);
    }

    [Fact]
    public void Parse_NameMissing_FallsBackToFullName()
    {
        var results = new List<AllureResultItem> { new() { FullName = "com.example.FullName" } };

        var cases = AllureParser.Parse(results);

        cases.Single().CaseName.Should().Be("com.example.FullName");
    }

    [Fact]
    public void Parse_NameAndFullNameMissing_FallsBackToPositionalUnknown()
    {
        var results = new List<AllureResultItem> { new(), new() };

        var cases = AllureParser.Parse(results);

        cases[0].CaseName.Should().Be("Unknown (1)");
        cases[1].CaseName.Should().Be("Unknown (2)");
    }

    [Fact]
    public void Parse_NoLabels_DefaultsSuiteName()
    {
        var results = new List<AllureResultItem> { new() { Name = "Case" } };

        var cases = AllureParser.Parse(results);

        cases.Single().SuiteName.Should().Be("Default Suite");
    }

    [Theory]
    [InlineData("suite", "SuiteLabel")]
    [InlineData("parentSuite", "ParentSuiteLabel")]
    [InlineData("testClass", "TestClassLabel")]
    public void Parse_ResolvesSuiteNameFromLabel(string labelName, string labelValue)
    {
        var results = new List<AllureResultItem>
        {
            new()
            {
                Name = "Case",
                Labels = [new AllureLabel { Name = labelName, Value = labelValue }],
            },
        };

        var cases = AllureParser.Parse(results);

        cases.Single().SuiteName.Should().Be(labelValue);
    }

    [Fact]
    public void Parse_SuiteLabelTakesPriorityOverParentSuiteAndTestClass()
    {
        var results = new List<AllureResultItem>
        {
            new()
            {
                Name = "Case",
                Labels =
                [
                    new AllureLabel { Name = "testClass", Value = "FromTestClass" },
                    new AllureLabel { Name = "parentSuite", Value = "FromParentSuite" },
                    new AllureLabel { Name = "suite", Value = "FromSuite" },
                ],
            },
        };

        var cases = AllureParser.Parse(results);

        cases.Single().SuiteName.Should().Be("FromSuite");
    }

    [Fact]
    public void Parse_StatusDetailsMessage_BecomesNotes()
    {
        var results = new List<AllureResultItem>
        {
            new()
            {
                Name = "Case",
                Status = "failed",
                StatusDetails = new AllureStatusDetails { Message = "expected true, got false" },
            },
        };

        var cases = AllureParser.Parse(results);

        cases.Single().Notes.Should().Be("expected true, got false");
    }

    [Fact]
    public void Parse_StartAndStopPresent_ComputesDurationMs()
    {
        var results = new List<AllureResultItem>
        {
            new()
            {
                Name = "Case",
                Start = 1_000,
                Stop = 1_500,
            },
        };

        var cases = AllureParser.Parse(results);

        cases.Single().DurationMs.Should().Be(500);
    }

    [Theory]
    [InlineData(null, 1500L)]
    [InlineData(1000L, null)]
    [InlineData(null, null)]
    public void Parse_StartOrStopMissing_YieldsNullDuration(long? start, long? stop)
    {
        var results = new List<AllureResultItem>
        {
            new()
            {
                Name = "Case",
                Start = start,
                Stop = stop,
            },
        };

        var cases = AllureParser.Parse(results);

        cases.Single().DurationMs.Should().BeNull();
    }
}
