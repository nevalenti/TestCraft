using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.TestResults;

[Collection(ApiCollection.Name)]
public class ResultListingApiTests(ApiFactory factory)
{
    private HttpClient CreateClient()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            Guid.NewGuid().ToString()
        );

        return client;
    }

    [Fact]
    public async Task List_KeepsResultsOfDeletedTestCases()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "Retired check");
        var run = await client.CreateRunAsync(project.Id);
        var result = await client.CreateResultAsync(project.Id, run.Id, testCase.Id);
        await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{testCase.Id}"
        );

        var page = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}/results")
        ).Content.ReadFromJsonAsync<Paginated<TestResultResponse>>();
        var single = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/results/{result.Id}"
        );

        page!.Items.Should().ContainSingle(item => item.TestCaseName == "Retired check");
        single.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task List_SortsByTestCaseName()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var run = await client.CreateRunAsync(project.Id);
        foreach (var name in new[] { "Bravo", "Alpha", "Charlie" })
        {
            var testCase = await client.CreateCaseAsync(project.Id, suite.Id, name);
            await client.CreateResultAsync(project.Id, run.Id, testCase.Id);
        }

        var page = await (
            await client.GetAsync(
                $"/api/v1/projects/{project.Id}/runs/{run.Id}/results?sort_by=test_case_name&sort_dir=desc"
            )
        ).Content.ReadFromJsonAsync<Paginated<TestResultResponse>>();

        page!.Items.Select(item => item.TestCaseName).Should().Equal("Charlie", "Bravo", "Alpha");
    }

    [Fact]
    public async Task List_ForUnknownRun_ReturnsNotFound()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{Guid.NewGuid()}/results"
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Update_WithStaleETag_ReturnsPreconditionFailed()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var run = await client.CreateRunAsync(project.Id);
        var result = await client.CreateResultAsync(project.Id, run.Id, testCase.Id);
        var path = $"/api/v1/projects/{project.Id}/runs/{run.Id}/results/{result.Id}";

        var first = await SendUpdateAsync(client, path, "\"1\"");
        var stale = await SendUpdateAsync(client, path, "\"1\"");

        first.StatusCode.Should().Be(HttpStatusCode.OK);
        (await first.Content.ReadFromJsonAsync<TestResultResponse>())!.Version.Should().Be(2);
        stale.StatusCode.Should().Be(HttpStatusCode.PreconditionFailed);
    }

    private static Task<HttpResponseMessage> SendUpdateAsync(
        HttpClient client,
        string path,
        string ifMatch
    )
    {
        var request = new HttpRequestMessage(HttpMethod.Put, path)
        {
            Content = WireJson.Content(
                new UpdateTestResult.Command { Status = TestResultStatus.Failed }
            ),
        };
        request.Headers.TryAddWithoutValidation("If-Match", ifMatch);

        return client.SendAsync(request);
    }
}
