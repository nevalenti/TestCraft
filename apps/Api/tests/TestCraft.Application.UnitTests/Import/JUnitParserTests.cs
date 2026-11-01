using FluentAssertions;
using TestCraft.Application.Features.Import;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Application.UnitTests.Import;

public class JUnitParserTests
{
    [Fact]
    public void Parse_TestsuitesRootWithPassedFailedSkipped_MapsAllFields()
    {
        const string xml = """
            <?xml version="1.0" encoding="UTF-8"?>
            <testsuites name="My Run">
              <testsuite name="LoginTests">
                <testcase name="Passes" classname="LoginTests" time="1.234" />
                <testcase name="Fails" classname="LoginTests" time="0.5">
                  <failure message="assertion failed">stack trace here</failure>
                </testcase>
                <testcase name="Skips" classname="LoginTests">
                  <skipped />
                </testcase>
              </testsuite>
            </testsuites>
            """;

        var (runName, cases) = JUnitParser.Parse(xml);

        runName.Should().Be("My Run");
        cases.Should().HaveCount(3);

        var passed = cases.Single(c => c.CaseName == "Passes");
        passed.SuiteName.Should().Be("LoginTests");
        passed.Status.Should().Be(TestResultStatus.Passed);
        passed.DurationMs.Should().Be(1234);
        passed.Notes.Should().BeNull();

        var failed = cases.Single(c => c.CaseName == "Fails");
        failed.Status.Should().Be(TestResultStatus.Failed);
        failed.Notes.Should().Be("assertion failed");
        failed.DurationMs.Should().Be(500);

        var skipped = cases.Single(c => c.CaseName == "Skips");
        skipped.Status.Should().Be(TestResultStatus.Skipped);
    }

    [Fact]
    public void Parse_BareTestsuiteRoot_UsesItsNameAndCases()
    {
        const string xml = """
            <testsuite name="Solo Suite">
              <testcase name="OnlyCase" classname="Solo Suite" />
            </testsuite>
            """;

        var (runName, cases) = JUnitParser.Parse(xml);

        runName.Should().Be("Solo Suite");
        cases.Should().ContainSingle(c => c.CaseName == "OnlyCase");
    }

    [Fact]
    public void Parse_UnrecognizedRootElement_ReturnsDefaultRunNameAndNoCases()
    {
        const string xml = "<somethingElse />";

        var (runName, cases) = JUnitParser.Parse(xml);

        runName.Should().Be("Imported Run");
        cases.Should().BeEmpty();
    }

    [Theory]
    [InlineData("not xml at all")]
    [InlineData("<unterminated>")]
    [InlineData("")]
    public void Parse_MalformedXml_ThrowsDomainException(string xml)
    {
        var act = () => JUnitParser.Parse(xml);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Parse_DoctypeWithExternalEntity_ThrowsDomainExceptionRatherThanResolvingIt()
    {
        const string xml = """
            <?xml version="1.0"?>
            <!DOCTYPE testsuites [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
            <testsuites name="&xxe;">
              <testsuite name="Suite"><testcase name="Case" /></testsuite>
            </testsuites>
            """;

        var act = () => JUnitParser.Parse(xml);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Parse_ClassnameEndingInDll_PrefersClassnameOverSuiteAttribute()
    {
        const string xml = """
            <testsuites>
              <testsuite name="MyTests.dll">
                <testcase name="Case" classname="Namespace.ActualSuite" />
              </testsuite>
            </testsuites>
            """;

        var (_, cases) = JUnitParser.Parse(xml);

        cases.Single().SuiteName.Should().Be("Namespace.ActualSuite");
    }

    [Fact]
    public void Parse_CaseNameWithMultipleSeparators_SplitsOnTheLastOccurrence()
    {
        const string xml = """
            <testsuites>
              <testsuite name="Suite">
                <testcase name="Given a user > When they log in > Then they see the dashboard" classname="Suite" />
              </testsuite>
            </testsuites>
            """;

        var (_, cases) = JUnitParser.Parse(xml);

        var steps = cases.Single().Steps;
        steps.Should().ContainSingle();
        steps![0].Action.Should().Be("Given a user > When they log in");
        steps[0].ExpectedResult.Should().Be("Then they see the dashboard");
    }

    [Fact]
    public void Parse_CaseNameWithoutSeparator_ProducesNoSteps()
    {
        const string xml = """
            <testsuites>
              <testsuite name="Suite">
                <testcase name="JustAName" classname="Suite" />
              </testsuite>
            </testsuites>
            """;

        var (_, cases) = JUnitParser.Parse(xml);

        cases.Single().Steps.Should().BeEmpty();
    }

    [Fact]
    public void Parse_NonNumericTimeAttribute_YieldsNullDuration()
    {
        const string xml = """
            <testsuites>
              <testsuite name="Suite">
                <testcase name="Case" classname="Suite" time="not-a-number" />
              </testsuite>
            </testsuites>
            """;

        var (_, cases) = JUnitParser.Parse(xml);

        cases.Single().DurationMs.Should().BeNull();
    }

    [Fact]
    public void Parse_ErrorElementWithoutMessageAttribute_FallsBackToInnerText()
    {
        const string xml = """
            <testsuites>
              <testsuite name="Suite">
                <testcase name="Case" classname="Suite">
                  <error>boom, everything is on fire</error>
                </testcase>
              </testsuite>
            </testsuites>
            """;

        var (_, cases) = JUnitParser.Parse(xml);

        cases.Single().Status.Should().Be(TestResultStatus.Failed);
        cases.Single().Notes.Should().Be("boom, everything is on fire");
    }
}
