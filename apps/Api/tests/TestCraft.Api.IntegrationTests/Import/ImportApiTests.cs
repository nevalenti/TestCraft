using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Import;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.Import;

[Collection(ApiCollection.Name)]
public class ImportApiTests(ApiFactory factory)
{
    private const string JUnitXml = """
        <testsuites name="My Suite Run">
          <testsuite name="Auth">
            <testcase name="login works" classname="Auth.Login" />
          </testsuite>
        </testsuites>
        """;

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
    public async Task ImportJUnit_WithCustomNameAndSource_UsesProvidedValues()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/import/junit",
            new ImportJUnit.Command
            {
                Xml = JUnitXml,
                Environment = "ci",
                Name = "Nightly Run",
                Source = "jenkins",
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var job = await response.Content.ReadFromJsonAsync<ImportJobResponse>(
            ApiTestHelpers.JsonOptions
        );
        job!.Status.Should().Be(ImportJobStatus.Pending);

        var completedJob = await client.WaitForImportJobAsync(project.Id, job.Id);
        completedJob.Status.Should().Be(ImportJobStatus.Completed);
        completedJob.TestRunId.Should().NotBeNull();

        var run = await client.GetRunAsync(project.Id, completedJob.TestRunId!.Value);
        run.Name.Should().Be("Nightly Run");
        run.Source.Should().Be("jenkins");
        run.Status.Should().Be(TestRunStatus.Completed);
    }

    [Fact]
    public async Task ImportJUnit_WithEmptyXml_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/import/junit",
            new ImportJUnit.Command { Xml = "", Environment = "ci" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task ImportJUnit_WithEmptyEnvironment_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/import/junit",
            new ImportJUnit.Command { Xml = JUnitXml, Environment = "" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task ImportJUnit_WithEmptyNameProvided_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/import/junit",
            new ImportJUnit.Command
            {
                Xml = JUnitXml,
                Environment = "ci",
                Name = "",
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task ImportJUnit_WithEmptySourceProvided_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/import/junit",
            new ImportJUnit.Command
            {
                Xml = JUnitXml,
                Environment = "ci",
                Source = "",
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task ImportJUnit_OtherUsersProject_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        var project = await ownerClient.CreateProjectAsync();

        var response = await otherClient.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/import/junit",
            new ImportJUnit.Command { Xml = JUnitXml, Environment = "ci" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task ImportJUnit_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{Guid.NewGuid()}/import/junit",
            new ImportJUnit.Command { Xml = JUnitXml, Environment = "ci" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ImportAllure_WithEmptyResults_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/import/allure",
            new ImportAllure.Command { Results = [], Environment = "ci" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task ImportAllure_WithInvalidStatus_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/import/allure",
            new ImportAllure.Command
            {
                Environment = "ci",
                Results =
                [
                    new AllureResultItem { Name = "weird result", Status = "not-a-real-status" },
                ],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task ImportAllure_WithValidResults_CreatesCompletedRun()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/import/allure",
            new ImportAllure.Command
            {
                Environment = "ci",
                Results =
                [
                    new AllureResultItem
                    {
                        Name = "checkout flow works",
                        Status = "passed",
                        Labels = [new AllureLabel { Name = "suite", Value = "Checkout" }],
                    },
                ],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var job = await response.Content.ReadFromJsonAsync<ImportJobResponse>(
            ApiTestHelpers.JsonOptions
        );
        job!.Status.Should().Be(ImportJobStatus.Pending);

        var completedJob = await client.WaitForImportJobAsync(project.Id, job.Id);
        completedJob.Status.Should().Be(ImportJobStatus.Completed);
        completedJob.TestRunId.Should().NotBeNull();

        var run = await client.GetRunAsync(project.Id, completedJob.TestRunId!.Value);
        run.Name.Should().Be(ImportAllure.Command.DefaultRunName);
        run.Status.Should().Be(TestRunStatus.Completed);
    }

    [Fact]
    public async Task GetById_NonExistentJob_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/import/{Guid.NewGuid()}"
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task GetById_OtherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());

        var project = await owner.CreateProjectAsync();
        var job = await (
            await owner.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/import/junit",
                new ImportJUnit.Command
                {
                    Xml = JUnitXml,
                    Environment = "ci",
                    Name = "Owner Run",
                }
            )
        ).Content.ReadFromJsonAsync<ImportJobResponse>(ApiTestHelpers.JsonOptions);

        var response = await other.GetAsync($"/api/v1/projects/{project.Id}/import/{job!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
