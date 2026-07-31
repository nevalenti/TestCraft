using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestCases;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.TestCases;

[Collection(ApiCollection.Name)]
public class TestCasesApiTests(ApiFactory factory)
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
    public async Task Create_Then_GetById_ReturnsCase()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases",
            new CreateTestCase.Command
            {
                Name = "Successful login",
                Description = "Verify a user can log in",
                Priority = TestCasePriority.High,
            }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<TestCaseResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Name.Should().Be("Successful login");
        created.Priority.Should().Be(TestCasePriority.High);
        created.SuiteId.Should().Be(suite.Id);
        created.StepCount.Should().Be(0);

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{created.Id}"
        );
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<TestCaseResponse>(
            ApiTestHelpers.JsonOptions
        );
        fetched!.Id.Should().Be(created.Id);
    }

    [Fact]
    public async Task Create_WithoutPriority_DefaultsToMedium()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases",
            new CreateTestCase.Command { Name = "Default priority case" }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<TestCaseResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Priority.Should().Be(TestCasePriority.Medium);
    }

    [Fact]
    public async Task GetAll_FiltersBySearch()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);

        await client.CreateCaseAsync(project.Id, suite.Id, "Successful login");
        await client.CreateCaseAsync(project.Id, suite.Id, "Failed checkout");

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases?search=login"
        );
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await response.Content.ReadFromJsonAsync<Paginated<TestCaseResponse>>(
            ApiTestHelpers.JsonOptions
        );
        page!.Items.Should().ContainSingle(testCase => testCase.Name == "Successful login");
        page.Items.Should().NotContain(testCase => testCase.Name == "Failed checkout");
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(
            project.Id,
            suite.Id,
            "Old Name",
            TestCasePriority.Low
        );

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{testCase.Id}",
            new UpdateTestCase.Command
            {
                Id = testCase.Id,
                Name = "New Name",
                Description = "Updated",
                Priority = TestCasePriority.Critical,
            }
        );

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<TestCaseResponse>(
            ApiTestHelpers.JsonOptions
        );
        updated!.Name.Should().Be("New Name");
        updated.Description.Should().Be("Updated");
        updated.Priority.Should().Be(TestCasePriority.Critical);
    }

    [Fact]
    public async Task Update_ChangesFields_PreservesCreatedAtButAdvancesUpdatedAt()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);

        testCase.CreatedAt.Should().Be(testCase.UpdatedAt);
        testCase.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(10));

        await Task.Delay(TimeSpan.FromMilliseconds(50));

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{testCase.Id}",
            new UpdateTestCase.Command
            {
                Id = testCase.Id,
                Name = "New Name",
                Description = "Updated",
                Priority = TestCasePriority.Critical,
            }
        );

        var updated = await updateResponse.Content.ReadFromJsonAsync<TestCaseResponse>(
            ApiTestHelpers.JsonOptions
        );

        updated!.CreatedAt.Should().BeCloseTo(testCase.CreatedAt, TimeSpan.FromMilliseconds(1));
        updated.UpdatedAt.Should().BeAfter(testCase.UpdatedAt);
    }

    [Fact]
    public async Task Update_NonExistentCase_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var caseId = Guid.NewGuid();

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{caseId}",
            new UpdateTestCase.Command
            {
                Id = caseId,
                Name = "Doesn't matter",
                Priority = TestCasePriority.Medium,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Delete_RemovesCase()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "To Delete");

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{testCase.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{testCase.Id}"
        );
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{Guid.NewGuid()}/suites/{Guid.NewGuid()}/cases",
            new CreateTestCase.Command { Name = "Nope" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithInvalidBody_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases",
            new CreateTestCase.Command { Name = "" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }
}
