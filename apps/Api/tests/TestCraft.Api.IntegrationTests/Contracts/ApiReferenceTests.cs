using System.Text.Json.Nodes;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;

namespace TestCraft.Api.IntegrationTests.Contracts;

[Collection(ApiCollection.Name)]
public class ApiReferenceTests(ApiFactory factory)
{
    [Fact]
    public async Task Contract_IsServedWithASameOriginServer()
    {
        var document = JsonNode.Parse(
            await factory.CreateClient().GetStringAsync("/api/docs/v1/contract.json")
        )!;

        document["info"]!["title"]!.GetValue<string>().Should().Be("TestCraft API");
        document["paths"]!.AsObject().ContainsKey("/api/v1/projects").Should().BeTrue();
        document["servers"]![0]!["url"]!.GetValue<string>().Should().Be("/");
    }
}
