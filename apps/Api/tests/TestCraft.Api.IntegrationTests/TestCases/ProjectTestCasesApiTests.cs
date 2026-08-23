using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

using FluentAssertions;

using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestCases;

namespace TestCraft.Api.IntegrationTests.TestCases;

[Collection(ApiCollection.Name)]
public class ProjectTestCasesApiTests(ApiFactory factory)
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
    public async Task GetAll_ReturnsCasesAcrossSuitesInProject()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var loginSuite = await client.CreateSuiteAsync(project.Id, "Login Suite");
        var checkoutSuite = await client.CreateSuiteAsync(project.Id, "Checkout Suite");

        await client.CreateCaseAsync(project.Id, loginSuite.Id, "Successful login");
        await client.CreateCaseAsync(project.Id, checkoutSuite.Id, "Successful checkout");

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/cases");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await response.Content.ReadFromJsonAsync<Paginated<TestCaseResponse>>(
            ApiTestHelpers.JsonOptions
        );
        page!.Items.Should().Contain(testCase => testCase.Name == "Successful login");
        page.Items.Should().Contain(testCase => testCase.Name == "Successful checkout");
    }

    [Fact]
    public async Task GetAll_FiltersBySearch()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);

        await client.CreateCaseAsync(project.Id, suite.Id, "Successful login");
        await client.CreateCaseAsync(project.Id, suite.Id, "Failed checkout");

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/cases?search=login");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await response.Content.ReadFromJsonAsync<Paginated<TestCaseResponse>>(
            ApiTestHelpers.JsonOptions
        );
        page!.Items.Should().ContainSingle(testCase => testCase.Name == "Successful login");
    }

    [Fact]
    public async Task GetAll_OtherUsersProject_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        var project = await ownerClient.CreateProjectAsync();

        var response = await otherClient.GetAsync($"/api/v1/projects/{project.Id}/cases");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }
}
