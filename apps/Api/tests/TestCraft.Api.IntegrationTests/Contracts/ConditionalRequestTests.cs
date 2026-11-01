using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Nodes;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Features.Notes;
using TestCraft.Application.Features.Projects;
using TestCraft.Application.Features.TestCases;
using TestCraft.Application.Features.TestPlans;

namespace TestCraft.Api.IntegrationTests.Contracts;

[Collection(ApiCollection.Name)]
public class ConditionalRequestTests(ApiFactory factory)
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
    public async Task Update_WithoutIfMatch_ReportsTheMissingHeader()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}",
            new UpdateProject.Command { Name = "Renamed" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var error = JsonNode.Parse(await response.Content.ReadAsStringAsync())!["errors"]!
            .AsArray()
            .Should()
            .ContainSingle()
            .Subject!;
        error["field"]!.GetValue<string>().Should().Be("if-match");
        error["message"]!.GetValue<string>().Should().Be("Field required");
        error["location"]!
            .AsArray()
            .Select(part => part!.GetValue<string>())
            .Should()
            .Equal("header", "if-match");
    }

    [Fact]
    public async Task Update_WithWildcardIfMatch_FailsThePrecondition()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        var request = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/projects/{project.Id}")
        {
            Content = WireJson.Content(new UpdateProject.Command { Name = "Renamed" }),
        };
        request.Headers.TryAddWithoutValidation("If-Match", "*");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.PreconditionFailed);
    }

    [Fact]
    public async Task ResponsesWithAnETag_AreRevalidated_AndOthersAreNotStored()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();

        var single = await client.GetAsync($"/api/v1/projects/{project.Id}");
        var list = await client.GetAsync("/api/v1/projects");

        single.Headers.ETag.Should().NotBeNull();
        single
            .Headers.CacheControl.Should()
            .BeEquivalentTo(new CacheControlHeaderValue { Private = true, NoCache = true });
        list.Headers.CacheControl.Should()
            .BeEquivalentTo(new CacheControlHeaderValue { NoStore = true });
    }

    [Fact]
    public async Task OversizedBody_IsRefusedBeforeAuthentication()
    {
        var anonymous = factory.CreateClient();
        var body = new StringContent(
            $$"""{"name":"{{new string('a', 200_000)}}"}""",
            Encoding.UTF8,
            "application/json"
        );

        var response = await anonymous.PostAsync("/api/v1/projects", body);

        response.StatusCode.Should().Be(HttpStatusCode.RequestEntityTooLarge);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Note_AboveTheDefaultBodyLimit_IsAccepted()
    {
        var client = CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/v1/notes",
            new CreateNote.Command { Title = "Long", Content = new string('x', 900_000) }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task PlanVersion_MovesWhenItsCasesChange()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "Login");
        var plan = await client.CreatePlanAsync(project.Id);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestCaseId = testCase.Id }
        );
        var afterAdd = (await client.GetPlanAsync(project.Id, plan.Id)).Version;

        await client.UpdateAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{testCase.Id}",
            new UpdateTestCase.Command { Name = "Sign in", Priority = testCase.Priority }
        );
        var afterRename = (await client.GetPlanAsync(project.Id, plan.Id)).Version;

        afterAdd.Should().Be(plan.Version + 1);
        afterRename.Should().Be(afterAdd + 1);
    }
}
