using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Features.Analytics;
using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.Analytics;

[Collection(ApiCollection.Name)]
public class AnalyticsApiTests(ApiFactory factory)
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
    public async Task GetTrend_NoRuns_ReturnsEmptyList()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/analytics/trend");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var trend = await response.Content.ReadFromJsonAsync<IReadOnlyList<TrendPoint>>(
            ApiTestHelpers.JsonOptions
        );
        trend.Should().BeEmpty();
    }

    [Fact]
    public async Task GetTrend_WithRuns_ReturnsTrendPoints()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        await client.CreateRunAsync(project.Id, "Run 1");
        await client.CreateRunAsync(project.Id, "Run 2");

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/analytics/trend");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var trend = await response.Content.ReadFromJsonAsync<IReadOnlyList<TrendPoint>>(
            ApiTestHelpers.JsonOptions
        );
        trend.Should().HaveCountGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task GetSuiteBreakdown_WithResults_GroupsByStatus()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id, "Suite A");
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var run = await client.CreateRunAsync(project.Id);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/results",
            new CreateTestResult.Command
            {
                TestCaseId = testCase.Id,
                Status = TestResultStatus.Passed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/analytics/runs/{run.Id}/suite-breakdown"
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var breakdown = await response.Content.ReadFromJsonAsync<IReadOnlyList<SuiteBreakdown>>(
            ApiTestHelpers.JsonOptions
        );
        breakdown.Should().ContainSingle(item => item.SuiteName == "Suite A" && item.Passed == 1);
    }

    [Fact]
    public async Task GetFlaky_NoResults_ReturnsEmpty()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/analytics/flaky");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var flaky = await response.Content.ReadFromJsonAsync<IReadOnlyList<FlakyTestStat>>(
            ApiTestHelpers.JsonOptions
        );
        flaky.Should().BeEmpty();
    }

    [Fact]
    public async Task Compare_TwoRuns_ReturnsDiff()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var runA = await client.CreateRunAsync(project.Id, "Run A");
        var runB = await client.CreateRunAsync(project.Id, "Run B");

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{runA.Id}/results",
            new CreateTestResult.Command
            {
                TestCaseId = testCase.Id,
                Status = TestResultStatus.Passed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );
        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{runB.Id}/results",
            new CreateTestResult.Command
            {
                TestCaseId = testCase.Id,
                Status = TestResultStatus.Failed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/analytics/runs/compare?runAId={runA.Id}&runBId={runB.Id}"
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var comparison = await response.Content.ReadFromJsonAsync<RunComparison>(
            ApiTestHelpers.JsonOptions
        );
        comparison!.Results.Should().ContainSingle(result => result.IsRegression);
    }

    [Fact]
    public async Task GetTrend_OtherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());

        var project = await owner.CreateProjectAsync();

        var response = await other.GetAsync($"/api/v1/projects/{project.Id}/analytics/trend");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
