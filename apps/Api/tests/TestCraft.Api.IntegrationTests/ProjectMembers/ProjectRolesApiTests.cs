using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using TestCraft.Api.Errors;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Features.ProjectMembers;
using TestCraft.Application.Features.Projects;
using TestCraft.Application.Features.TestSuites;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.ProjectMembers;

[Collection(ApiCollection.Name)]
public class ProjectRolesApiTests(ApiFactory factory)
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

    private async Task<(HttpClient Client, ProjectMemberResponse Member)> AddMemberAsync(
        HttpClient owner,
        ProjectId projectId,
        AssignableRole role
    )
    {
        var userId = Guid.NewGuid();
        var email = $"{userId}@example.com";
        factory.RegisterUser(email, userId);
        var response = await owner.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/members",
            new AddProjectMember.Command { Email = email, Role = role }
        );
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        return (
            CreateClient(userId),
            (await response.Content.ReadFromJsonAsync<ProjectMemberResponse>())!
        );
    }

    [Fact]
    public async Task Viewer_CanReadButNotChangeTestData()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var (viewer, _) = await AddMemberAsync(owner, project.Id, AssignableRole.Viewer);

        var read = await viewer.GetAsync($"/api/v1/projects/{project.Id}/suites");
        var write = await viewer.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites",
            new CreateTestSuite.Command { Name = "Not allowed" }
        );

        read.StatusCode.Should().Be(HttpStatusCode.OK);
        write.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await write.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Detail.Should()
            .Be("This action requires the editor role or higher");
    }

    [Fact]
    public async Task Editor_CannotReadProjectSettings()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var (editor, _) = await AddMemberAsync(owner, project.Id, AssignableRole.Editor);

        var tokens = await editor.GetAsync($"/api/v1/projects/{project.Id}/tokens");
        var webhooks = await editor.GetAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks"
        );

        tokens.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        webhooks.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Admin_ManagesViewersAndEditors()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var (admin, _) = await AddMemberAsync(owner, project.Id, AssignableRole.Admin);
        var (_, editor) = await AddMemberAsync(owner, project.Id, AssignableRole.Editor);

        var promote = await admin.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/members/{editor.Id}",
            new UpdateProjectMember.Command { Role = AssignableRole.Viewer }
        );
        var remove = await admin.DeleteAsync($"/api/v1/projects/{project.Id}/members/{editor.Id}");

        promote.StatusCode.Should().Be(HttpStatusCode.OK);
        (await promote.Content.ReadFromJsonAsync<ProjectMemberResponse>())!
            .Role.Should()
            .Be(AssignableRole.Viewer);
        remove.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task OnlyOwner_GrantsOrRevokesAdmin()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var (admin, _) = await AddMemberAsync(owner, project.Id, AssignableRole.Admin);
        var (_, otherAdmin) = await AddMemberAsync(owner, project.Id, AssignableRole.Admin);
        var (_, editor) = await AddMemberAsync(owner, project.Id, AssignableRole.Editor);

        var grant = await admin.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/members/{editor.Id}",
            new UpdateProjectMember.Command { Role = AssignableRole.Admin }
        );
        var revoke = await admin.DeleteAsync(
            $"/api/v1/projects/{project.Id}/members/{otherAdmin.Id}"
        );
        var ownerGrant = await owner.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/members/{editor.Id}",
            new UpdateProjectMember.Command { Role = AssignableRole.Admin }
        );

        grant.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await grant.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Code.Should()
            .Be("ADMIN_ROLE_OWNER_ONLY");
        revoke.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        ownerGrant.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ProjectResponse_CarriesTheMembersRole()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var (viewer, _) = await AddMemberAsync(owner, project.Id, AssignableRole.Viewer);

        var seen = await (
            await viewer.GetAsync($"/api/v1/projects/{project.Id}")
        ).Content.ReadFromJsonAsync<ProjectResponse>();

        seen!.Role.Should().Be(ProjectRole.Viewer);
    }

    [Fact]
    public async Task Add_UnverifiedEmail_ReturnsUnprocessable()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var userId = Guid.NewGuid();
        var email = $"{userId}@example.com";
        factory.RegisterUser(email, userId, emailVerified: false);

        var response = await owner.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/members",
            new AddProjectMember.Command { Email = email }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        (await response.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Code.Should()
            .Be("EMAIL_NOT_VERIFIED");
    }

    [Fact]
    public async Task Add_ExistingMember_ReturnsConflict()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var userId = Guid.NewGuid();
        var email = $"{userId}@example.com";
        factory.RegisterUser(email, userId);
        await owner.AddMemberAsync(project.Id, email);

        var again = await owner.AddMemberAsync(project.Id, email);

        again.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await again.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Code.Should()
            .Be("MEMBER_ALREADY_EXISTS");
    }
}
