using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;

namespace TestCraft.Api.IntegrationTests.Contracts;

[Collection(ApiCollection.Name)]
public class OpenApiContractTests(ApiFactory factory)
{
    private static readonly string ContractDirectory = Path.Combine(
        RepositoryRoot(),
        "apps",
        "Api",
        "openapi",
        "contract"
    );

    private static readonly string BaselinePath = Path.Combine(ContractDirectory, "baseline.txt");

    private static readonly JsonSerializerOptions IndentedJson = new() { WriteIndented = true };

    private const string BaselineHeader = """
        # Differences between the generated OpenAPI document and openapi/contract/v1.json.
        # "missing" is in the contract but not served; "extra" is served but not in the contract.
        # Keep an entry only with a "# reason"; rewrite with UPDATE_CONTRACT_BASELINE=1.
        """;

    [Fact]
    public async Task GeneratedDocument_MatchesContract()
    {
        var contract = JsonNode.Parse(
            await File.ReadAllTextAsync(Path.Combine(ContractDirectory, "v1.json"))
        )!;
        var generated = JsonNode.Parse(
            await factory.CreateClient().GetStringAsync("/api/docs/v1/swagger.json")
        )!;

        var expected = OpenApiFacts.From(contract);
        var actual = OpenApiFacts.From(generated);
        var differences = expected
            .Except(actual)
            .Select(fact => $"missing {fact}")
            .Concat(actual.Except(expected).Select(fact => $"extra   {fact}"))
            .ToHashSet(StringComparer.Ordinal);

        var reasons = ReadBaseline();

        if (Environment.GetEnvironmentVariable("UPDATE_CONTRACT_BASELINE") == "1")
        {
            var lines = differences
                .Order(StringComparer.Ordinal)
                .Select(line =>
                    reasons.GetValueOrDefault(line) is { Length: > 0 } reason
                        ? $"{line}  # {reason}"
                        : line
                );
            await File.WriteAllLinesAsync(BaselinePath, [BaselineHeader, .. lines]);
            await File.WriteAllTextAsync(
                Path.Combine(ContractDirectory, "..", "v1.json"),
                generated.ToJsonString(IndentedJson)
            );
            return;
        }

        var unexpected = differences.Except(reasons.Keys).Order(StringComparer.Ordinal).ToList();
        var resolved = reasons.Keys.Except(differences).Order(StringComparer.Ordinal).ToList();

        unexpected.Should().BeEmpty("the API should not drift further from the contract");
        resolved.Should().BeEmpty("closed gaps should be removed from the baseline");
    }

    private static Dictionary<string, string> ReadBaseline()
    {
        if (!File.Exists(BaselinePath))
        {
            return [];
        }

        return File.ReadLines(BaselinePath)
            .Where(line => line.Length > 0 && !line.StartsWith('#'))
            .Select(line => line.Split("  # ", 2))
            .ToDictionary(parts => parts[0], parts => parts.Length > 1 ? parts[1] : "");
    }

    private static string RepositoryRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (
            directory is not null
            && !File.Exists(Path.Combine(directory.FullName, "TestCraft.slnx"))
        )
        {
            directory = directory.Parent;
        }

        return directory?.FullName
            ?? throw new InvalidOperationException(
                "TestCraft.slnx not found above the test output"
            );
    }
}
