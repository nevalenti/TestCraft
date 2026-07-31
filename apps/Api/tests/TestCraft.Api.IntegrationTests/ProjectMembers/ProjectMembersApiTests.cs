using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.ProjectMembers;
using TestCraft.Application.Features.Projects;

namespace TestCraft.Api.IntegrationTests.ProjectMembers;

[Collection(ApiCollection.Name)]
public class ProjectMembersApiTests(ApiFactory factory)
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

    private void RegisterKeycloakUser(string email, Guid userId, string? displayName = null) =>
        (
            (FakeKeycloakUserDirectory)factory.Services.GetRequiredService<IKeycloakUserDirectory>()
        ).Register(email, userId, displayName);

    [Fact]
    public async Task Add_ByOwner_ReturnsMember()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var memberId = Guid.NewGuid();
        RegisterKeycloakUser("member@example.com", memberId, "Member Person");

        var project = await ownerClient.CreateProjectAsync();

        var response = await ownerClient.AddMemberAsync(project.Id, "member@example.com");
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var member = await response.Content.ReadFromJsonAsync<ProjectMemberResponse>();
        member!.Email.Should().Be("member@example.com");
        member.DisplayName.Should().Be("Member Person");

        var listResponse = await ownerClient.GetAsync($"/api/v1/projects/{project.Id}/members");
        var list = await listResponse.Content.ReadFromJsonAsync<List<ProjectMemberResponse>>();
        list.Should().ContainSingle(projectMember => projectMember.Email == "member@example.com");
    }

    [Fact]
    public async Task Add_UnknownEmail_ReturnsUnprocessable()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var project = await ownerClient.CreateProjectAsync();

        var response = await ownerClient.AddMemberAsync(project.Id, "nobody@example.com");

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task Add_SameEmailTwice_ReturnsUnprocessable()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        RegisterKeycloakUser("member@example.com", Guid.NewGuid());
        var project = await ownerClient.CreateProjectAsync();

        await ownerClient.AddMemberAsync(project.Id, "member@example.com");
        var second = await ownerClient.AddMemberAsync(project.Id, "member@example.com");

        second.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task Add_ByNonOwnerMember_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var memberId = Guid.NewGuid();
        RegisterKeycloakUser("member@example.com", memberId);
        var project = await ownerClient.CreateProjectAsync();
        await ownerClient.AddMemberAsync(project.Id, "member@example.com");

        var memberClient = CreateClient(memberId);
        RegisterKeycloakUser("someone-else@example.com", Guid.NewGuid());
        var response = await memberClient.AddMemberAsync(project.Id, "someone-else@example.com");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Member_CanReadProjectAndSubResources()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var memberId = Guid.NewGuid();
        RegisterKeycloakUser("member@example.com", memberId);
        var project = await ownerClient.CreateProjectAsync();
        await ownerClient.AddMemberAsync(project.Id, "member@example.com");
        await ownerClient.CreateSuiteAsync(project.Id, "Suite A");

        var memberClient = CreateClient(memberId);

        var projectResponse = await memberClient.GetAsync($"/api/v1/projects/{project.Id}");
        projectResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var fetched = await projectResponse.Content.ReadFromJsonAsync<ProjectResponse>();
        fetched!.IsOwner.Should().BeFalse();

        var suitesResponse = await memberClient.GetAsync($"/api/v1/projects/{project.Id}/suites");
        suitesResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Member_CannotDeleteProject()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var memberId = Guid.NewGuid();
        RegisterKeycloakUser("member@example.com", memberId);
        var project = await ownerClient.CreateProjectAsync();
        await ownerClient.AddMemberAsync(project.Id, "member@example.com");

        var memberClient = CreateClient(memberId);
        var response = await memberClient.DeleteAsync($"/api/v1/projects/{project.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Remove_ByOwner_RevokesMemberAccess()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var memberId = Guid.NewGuid();
        RegisterKeycloakUser("member@example.com", memberId);
        var project = await ownerClient.CreateProjectAsync();
        var added = await (
            await ownerClient.AddMemberAsync(project.Id, "member@example.com")
        ).Content.ReadFromJsonAsync<ProjectMemberResponse>();

        var removeResponse = await ownerClient.DeleteAsync(
            $"/api/v1/projects/{project.Id}/members/{added!.Id}"
        );
        removeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var memberClient = CreateClient(memberId);
        var response = await memberClient.GetAsync($"/api/v1/projects/{project.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Remove_ByNonOwnerMember_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var memberId = Guid.NewGuid();
        RegisterKeycloakUser("member@example.com", memberId);
        var project = await ownerClient.CreateProjectAsync();
        var added = await (
            await ownerClient.AddMemberAsync(project.Id, "member@example.com")
        ).Content.ReadFromJsonAsync<ProjectMemberResponse>();

        var memberClient = CreateClient(memberId);
        var response = await memberClient.DeleteAsync(
            $"/api/v1/projects/{project.Id}/members/{added!.Id}"
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
