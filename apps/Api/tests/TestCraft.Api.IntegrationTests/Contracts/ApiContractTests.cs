using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.RegularExpressions;

using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Features.Projects;

namespace TestCraft.Api.IntegrationTests.Contracts;

[Collection(ApiCollection.Name)]
public class ApiContractTests(ApiFactory factory)
{
    private HttpClient CreateClient(Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            userId.ToString()
        );

        return client;
    }

    [Fact]
    public async Task ProjectResponse_ShapeMatchesContract()
    {
        var client = CreateClient(Guid.NewGuid());
        var createResponse = await client.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProject.Command
            {
                Name = "Contract Project",
                Description = "For contract testing",
            }
        );
        var project = (
            await createResponse.Content.ReadFromJsonAsync<ProjectResponse>(
                ApiTestHelpers.JsonOptions
            )
        )!;

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}");
        var json = await response.Content.ReadAsStringAsync();

        await Verifier.Verify(json).ScrubInlineGuids().AddScrubber(ScrubTimestamps);
    }

    [Fact]
    public async Task TestCaseResponse_ShapeMatchesContract()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "Contract Case");

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{testCase.Id}"
        );
        var json = await response.Content.ReadAsStringAsync();

        await Verifier.Verify(json).ScrubInlineGuids().AddScrubber(ScrubTimestamps);
    }

    private static readonly Regex TimestampPattern = new(
        @"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+\+\d{2}:\d{2}"
    );

    private static void ScrubTimestamps(StringBuilder builder)
    {
        var scrubbed = TimestampPattern.Replace(builder.ToString(), "TIMESTAMP");
        builder.Clear();
        builder.Append(scrubbed);
    }
}
