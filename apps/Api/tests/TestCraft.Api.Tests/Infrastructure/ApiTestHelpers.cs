using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using TestCraft.Api.Requests;
using TestCraft.Application.Responses;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.Tests.Infrastructure;

internal static class ApiTestHelpers
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    public static async Task<ProjectResponse> CreateProjectAsync(
        this HttpClient client,
        string name = "Project"
    )
    {
        var response = await client.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProjectRequest { Name = name }
        );

        return (await response.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions))!;
    }

    public static async Task<TestSuiteResponse> CreateSuiteAsync(
        this HttpClient client,
        Guid projectId,
        string name = "Suite"
    )
    {
        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites",
            new CreateTestSuiteRequest { Name = name }
        );

        return (await response.Content.ReadFromJsonAsync<TestSuiteResponse>(JsonOptions))!;
    }

    public static async Task<TestCaseResponse> CreateCaseAsync(
        this HttpClient client,
        Guid projectId,
        Guid suiteId,
        string name = "Case",
        TestCasePriority? priority = null
    )
    {
        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases",
            new CreateTestCaseRequest { Name = name, Priority = priority }
        );

        return (await response.Content.ReadFromJsonAsync<TestCaseResponse>(JsonOptions))!;
    }

    public static async Task<TestRunResponse> CreateRunAsync(
        this HttpClient client,
        Guid projectId,
        string name = "Run",
        string environment = "staging",
        TestRunStatus? status = null
    )
    {
        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs",
            new CreateTestRunRequest
            {
                Name = name,
                Environment = environment,
                Status = status,
            }
        );

        return (await response.Content.ReadFromJsonAsync<TestRunResponse>(JsonOptions))!;
    }
}
