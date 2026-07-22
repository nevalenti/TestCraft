using System.Xml;
using System.Xml.Linq;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Import;

public static class JUnitParser
{
    private const string DefaultRunName = "Imported Run";
    private const string Separator = " > ";

    public static (string RunName, List<ParsedTestCase> Cases) Parse(string xml)
    {
        XDocument doc;
        try
        {
            var settings = new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit };
            using var reader = XmlReader.Create(new StringReader(xml), settings);
            doc = XDocument.Load(reader);
        }
        catch (Exception)
        {
            throw new DomainException("Invalid JUnit XML: could not parse the document");
        }

        var root = doc.Root;
        if (root is null)
        {
            throw new DomainException("Invalid JUnit XML: could not parse the document");
        }

        string runName;
        IEnumerable<XElement> suites;

        if (root.Name.LocalName == "testsuites")
        {
            runName = StrVal(root.Attribute("name")?.Value) ?? DefaultRunName;
            suites = root.Elements("testsuite");
        }
        else if (root.Name.LocalName == "testsuite")
        {
            suites = [root];
            runName = StrVal(root.Attribute("name")?.Value) ?? DefaultRunName;
        }
        else
        {
            runName = DefaultRunName;
            suites = [];
        }

        var cases = new List<ParsedTestCase>();
        foreach (var suite in suites)
        {
            var suiteNameFromAttr = StrVal(suite.Attribute("name")?.Value);
            foreach (var testcase in suite.Elements("testcase"))
            {
                var caseName = StrVal(testcase.Attribute("name")?.Value) ?? "Unknown";
                var suiteName = ResolveSuiteName(suiteNameFromAttr, testcase);
                var (status, notes) = ResolveStatus(testcase);

                var durationMs = ParseDurationMs(testcase.Attribute("time")?.Value);

                cases.Add(
                    new ParsedTestCase
                    {
                        SuiteName = suiteName,
                        CaseName = caseName,
                        Status = status,
                        Notes = notes,
                        DurationMs = durationMs,
                        Steps = ParseSteps(caseName),
                    }
                );
            }
        }

        return (runName, cases);
    }

    private static (TestResultStatus Status, string? Notes) ResolveStatus(XElement testcase)
    {
        var failure = testcase.Element("failure") ?? testcase.Element("error");
        if (failure is not null)
        {
            return (TestResultStatus.Failed, ExtractXmlText(failure));
        }

        if (testcase.Element("skipped") is not null)
        {
            return (TestResultStatus.Skipped, null);
        }

        return (TestResultStatus.Passed, null);
    }

    private static string? ExtractXmlText(XElement element)
    {
        var messageAttr = element.Attribute("message");
        if (messageAttr is not null)
        {
            var text = messageAttr.Value.Trim();
            if (text.Length > 0)
            {
                return text;
            }
        }

        var raw = element.Value.Trim();

        return string.IsNullOrEmpty(raw) ? null : raw;
    }

    private static List<ParsedStep> ParseSteps(string caseName)
    {
        var separatorIndex = caseName.LastIndexOf(Separator, StringComparison.Ordinal);
        if (separatorIndex == -1)
        {
            return [];
        }

        return
        [
            new ParsedStep
            {
                Order = 1,
                Action = caseName[..separatorIndex],
                ExpectedResult = caseName[(separatorIndex + Separator.Length)..],
            },
        ];
    }

    private static long? ParseDurationMs(string? timeStr)
    {
        if (string.IsNullOrEmpty(timeStr))
            return null;
        if (
            double.TryParse(
                timeStr,
                System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture,
                out var seconds
            )
        )
            return (long)(seconds * 1000);
        return null;
    }

    private static string? StrVal(string? value) => string.IsNullOrEmpty(value) ? null : value;

    private static string ResolveSuiteName(string? suiteNameFromAttr, XElement testcase)
    {
        var classname = StrVal(testcase.Attribute("classname")?.Value);

        if (
            suiteNameFromAttr is not null
            && suiteNameFromAttr.EndsWith(".dll", StringComparison.OrdinalIgnoreCase)
        )
        {
            return classname ?? suiteNameFromAttr;
        }

        return suiteNameFromAttr ?? classname ?? "Default Suite";
    }
}
