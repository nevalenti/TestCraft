using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using TestCraft.Api.Errors;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.Projects;
using TestCraft.Application.Features.TestCases;
using TestCraft.Application.Features.TestCaseSteps;
using TestCraft.Application.Features.TestSuites;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.TestCases;

[Collection(ApiCollection.Name)]
public class CatalogRulesApiTests(ApiFactory factory)
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
    public async Task ListCases_SortsByPriorityRankNotName()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        foreach (
            var priority in new[]
            {
                TestCasePriority.Medium,
                TestCasePriority.Critical,
                TestCasePriority.Low,
                TestCasePriority.High,
            }
        )
        {
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases",
                new CreateTestCase.Command { Name = priority.ToString(), Priority = priority }
            );
        }

        var page = await (
            await client.GetAsync(
                $"/api/v1/projects/{project.Id}/cases?sort_by=priority&sort_dir=desc"
            )
        ).Content.ReadFromJsonAsync<Paginated<TestCaseResponse>>();

        page!
            .Items.Select(testCase => testCase.Priority)
            .Should()
            .Equal(
                TestCasePriority.Critical,
                TestCasePriority.High,
                TestCasePriority.Medium,
                TestCasePriority.Low
            );
    }

    [Fact]
    public async Task ListCases_InUnknownSuite_ReturnsNotFound()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/suites/{Guid.NewGuid()}/cases"
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateSuite_WithTakenName_ReturnsConflict()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        await client.CreateSuiteAsync(project.Id, "Checkout");

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites",
            new CreateTestSuite.Command { Name = "Checkout" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Detail.Should()
            .Be("An active suite with this name already exists");
    }

    [Fact]
    public async Task RenameCase_ToTakenName_ReturnsConflict()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        await client.CreateCaseAsync(project.Id, suite.Id, "Login");
        var other = await client.CreateCaseAsync(project.Id, suite.Id, "Logout");

        var response = await client.UpdateAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{other.Id}",
            new UpdateTestCase.Command { Name = "Login", Priority = TestCasePriority.Medium }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Detail.Should()
            .Be("An active test case with this name already exists");
    }

    [Fact]
    public async Task CreateProject_WithTakenName_ReturnsConflictWithCode()
    {
        var client = CreateClient();
        await client.CreateProjectAsync("Storefront");

        var response = await client.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProject.Command { Name = "Storefront" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Code.Should()
            .Be("PROJECT_NAME_TAKEN");
    }

    [Fact]
    public async Task CreateProject_ReusingDeletedProjectsName_Succeeds()
    {
        var client = CreateClient();
        var deleted = await client.CreateProjectAsync("Archive");
        await client.DeleteAsync($"/api/v1/projects/{deleted.Id}");

        var response = await client.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProject.Command { Name = "Archive" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task UpdateCase_WithStaleETag_ReturnsPreconditionFailed()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "Case");
        var path = $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{testCase.Id}";
        var update = new UpdateTestCase.Command
        {
            Name = "Renamed",
            Priority = TestCasePriority.High,
        };

        var first = await SendWithIfMatchAsync(client, path, update, "\"1\"");
        var stale = await SendWithIfMatchAsync(client, path, update, "\"1\"");

        first.StatusCode.Should().Be(HttpStatusCode.OK);
        first.Headers.ETag!.Tag.Should().Be("\"2\"");
        stale.StatusCode.Should().Be(HttpStatusCode.PreconditionFailed);
    }

    [Fact]
    public async Task UpdateStep_WithStaleETag_ReturnsPreconditionFailed()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "Case");
        var steps = $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{testCase.Id}/steps";
        var step = await (
            await client.PostAsJsonAsync(
                steps,
                new CreateTestCaseStep.Command
                {
                    Order = 1,
                    Action = "Open the page",
                    ExpectedResult = "It loads",
                }
            )
        ).Content.ReadFromJsonAsync<TestCaseStepResponse>();
        var update = new UpdateTestCaseStep.Command
        {
            Order = 1,
            Action = "Open the home page",
            ExpectedResult = "It loads",
        };

        await SendWithIfMatchAsync(client, $"{steps}/{step!.Id}", update, "\"1\"");
        var stale = await SendWithIfMatchAsync(client, $"{steps}/{step.Id}", update, "\"1\"");

        stale.StatusCode.Should().Be(HttpStatusCode.PreconditionFailed);
    }

    private static Task<HttpResponseMessage> SendWithIfMatchAsync<T>(
        HttpClient client,
        string path,
        T body,
        string ifMatch
    )
    {
        var request = new HttpRequestMessage(HttpMethod.Put, path)
        {
            Content = WireJson.Content(body),
        };
        request.Headers.TryAddWithoutValidation("If-Match", ifMatch);

        return client.SendAsync(request);
    }
}
