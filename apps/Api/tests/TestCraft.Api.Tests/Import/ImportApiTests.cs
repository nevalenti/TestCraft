using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.Import;
using TestCraft.Api.Tests.Infrastructure;
using TestCraft.Application.Import;
using TestCraft.Application.Import.Commands.ImportAllure;
using TestCraft.Application.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.Tests.Import;

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
            new ImportJUnitRequest
            {
                Xml = JUnitXml,
                Environment = "ci",
                Name = "Nightly Run",
                Source = "jenkins",
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var run = await response.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        run!.Name.Should().Be("Nightly Run");
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
            new ImportJUnitRequest { Xml = "", Environment = "ci" }
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
            new ImportJUnitRequest { Xml = JUnitXml, Environment = "" }
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
            new ImportJUnitRequest { Xml = JUnitXml, Environment = "ci" }
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
            new ImportJUnitRequest { Xml = JUnitXml, Environment = "ci" }
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
            new ImportAllureRequest { Results = [], Environment = "ci" }
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
            new ImportAllureRequest
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
            new ImportAllureRequest
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

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var run = await response.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        run!.Name.Should().Be(ImportAllureCommand.DefaultRunName);
        run.Status.Should().Be(TestRunStatus.Completed);
    }
}
