using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Features.Import;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Persistence;

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

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
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

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
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

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
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

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
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

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task ImportAllure_WithInvalidStatus_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/import/allure",
            new
            {
                environment = "ci",
                results = new[] { new { name = "weird result", status = "not-a-real-status" } },
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
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
                        Status = AllureStatus.Passed,
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

    [Fact]
    public async Task ImportJUnit_WhenSavingResultsFails_MarksJobFailedAndRollsBack()
    {
        await using var failingFactory = factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.ConfigureDbContext<AppDbContext>(options =>
                    options.AddInterceptors(new FailingInsertsInterceptor<TestResult>())
                )
            )
        );
        var client = failingFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            Guid.NewGuid().ToString()
        );
        var project = await client.CreateProjectAsync();

        var job = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/import/junit",
                new ImportJUnit.Command { Xml = JUnitXml, Environment = "ci" }
            )
        ).Content.ReadFromJsonAsync<ImportJobResponse>(ApiTestHelpers.JsonOptions);

        var finishedJob = await client.WaitForImportJobAsync(project.Id, job!.Id);
        finishedJob.Status.Should().Be(ImportJobStatus.Failed);
        finishedJob.TestRunId.Should().BeNull();

        using var scope = failingFactory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await context.TestSuites.CountAsync(suite => suite.ProjectId == project.Id))
            .Should()
            .Be(0);
    }
}
