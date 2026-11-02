using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.Notes;
using TestCraft.Application.Features.ProjectMembers;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.Notes;

[Collection(ApiCollection.Name)]
public class NotesApiTests(ApiFactory factory)
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
    public async Task PersonalNote_CrudRoundTrip()
    {
        var client = CreateClient(Guid.NewGuid());

        var created = await (
            await client.PostAsJsonAsync(
                "/api/v1/notes",
                new CreateNote.Command
                {
                    Title = "Deploy steps",
                    Content = "# Deploy\n\nRun **it**.",
                }
            )
        ).Content.ReadFromJsonAsync<NoteResponse>();
        var read = await client.GetAsync($"/api/v1/notes/{created!.Id}");
        var detail = await read.Content.ReadFromJsonAsync<NoteDetailResponse>();
        var updated = await client.UpdateAsJsonAsync(
            $"/api/v1/notes/{created.Id}",
            new UpdateNote.Command
            {
                Title = "Deploy",
                Language = "markdown",
                Content = "Changed",
            }
        );
        var afterUpdate = await (
            await client.GetAsync($"/api/v1/notes/{created.Id}")
        ).Content.ReadFromJsonAsync<NoteDetailResponse>();
        var deleted = await client.DeleteAsync($"/api/v1/notes/{created.Id}");
        var gone = await client.GetAsync($"/api/v1/notes/{created.Id}");

        created.ProjectId.Should().BeNull();
        created.Language.Should().Be("markdown");
        created.Excerpt.Should().Be("Deploy Run it.");
        created.SizeBytes.Should().Be(21);
        read.Headers.ETag!.Tag.Should().Be("\"1\"");
        detail!.Content.Should().Be("# Deploy\n\nRun **it**.");
        updated.StatusCode.Should().Be(HttpStatusCode.OK);
        afterUpdate!.Content.Should().Be("Changed");
        afterUpdate.Version.Should().Be(2);
        deleted.StatusCode.Should().Be(HttpStatusCode.NoContent);
        gone.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PersonalNotes_AreIsolatedPerUser()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());
        var note = await (
            await owner.PostAsJsonAsync("/api/v1/notes", new CreateNote.Command { Title = "Mine" })
        ).Content.ReadFromJsonAsync<NoteResponse>();

        var listed = await (await other.GetAsync("/api/v1/notes")).Content.ReadFromJsonAsync<
            Paginated<NoteResponse>
        >();
        var direct = await other.GetAsync($"/api/v1/notes/{note!.Id}");

        listed!.Items.Should().BeEmpty();
        direct.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PersonalNotes_SearchMatchesTitle()
    {
        var client = CreateClient(Guid.NewGuid());
        await client.PostAsJsonAsync(
            "/api/v1/notes",
            new CreateNote.Command { Title = "Release checklist" }
        );
        await client.PostAsJsonAsync(
            "/api/v1/notes",
            new CreateNote.Command { Title = "Retro", Content = "release went fine" }
        );

        var listed = await (
            await client.GetAsync("/api/v1/notes?search=release")
        ).Content.ReadFromJsonAsync<Paginated<NoteResponse>>();

        listed!.Items.Select(note => note.Title).Should().Equal("Release checklist");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("two\nlines")]
    public async Task Create_RequiresASingleLineTitle(string title)
    {
        var client = CreateClient(Guid.NewGuid());

        var response = await client.PostAsJsonAsync(
            "/api/v1/notes",
            new CreateNote.Command { Title = title }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task ProjectNote_IsSharedWithMembersAndNotListedAsPersonal()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var memberId = Guid.NewGuid();
        factory.RegisterUser($"{memberId}@example.com", memberId);
        await owner.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/members",
            new AddProjectMember.Command
            {
                Email = $"{memberId}@example.com",
                Role = AssignableRole.Viewer,
            }
        );
        var member = CreateClient(memberId);

        var created = await owner.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notes",
            new CreateNote.Command { Title = "Runbook", Content = "Steps" }
        );
        var note = await created.Content.ReadFromJsonAsync<NoteResponse>();
        created
            .Headers.Location!.AbsolutePath.Should()
            .Be($"/api/v1/projects/{project.Id}/notes/{note!.Id}");
        var seenByMember = await member.GetAsync(created.Headers.Location);
        var viewerWrite = await member.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notes",
            new CreateNote.Command { Title = "Not allowed" }
        );
        var personal = await (await owner.GetAsync("/api/v1/notes")).Content.ReadFromJsonAsync<
            Paginated<NoteResponse>
        >();

        note.ProjectId.Should().Be(project.Id);
        seenByMember.StatusCode.Should().Be(HttpStatusCode.OK);
        viewerWrite.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        personal!.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task ProjectNote_UnknownId_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/notes/{Guid.NewGuid()}"
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Update_WithStaleETag_ReturnsPreconditionFailed()
    {
        var client = CreateClient(Guid.NewGuid());
        var note = await (
            await client.PostAsJsonAsync(
                "/api/v1/notes",
                new CreateNote.Command { Title = "Draft" }
            )
        ).Content.ReadFromJsonAsync<NoteResponse>();
        var update = new UpdateNote.Command
        {
            Title = "Draft",
            Language = "markdown",
            Content = "v2",
        };

        await SendWithIfMatchAsync(client, $"/api/v1/notes/{note!.Id}", update, "\"1\"");
        var stale = await SendWithIfMatchAsync(client, $"/api/v1/notes/{note.Id}", update, "\"1\"");

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
