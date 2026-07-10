using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Notifications;

namespace TestCraft.Api.IntegrationTests.Notifications;

[Collection(ApiCollection.Name)]
public class NotificationsApiTests(ApiFactory factory)
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
    public async Task CreateWebhook_Then_GetAll_ReturnsSubscription()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks",
            new CreateWebhookSubscription.Command
            {
                ProjectId = Guid.Empty,
                Url = "https://example.com/hook",
                Events = ["run.completed"],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var created = await response.Content.ReadFromJsonAsync<WebhookSubscriptionResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Url.Should().Be("https://example.com/hook");
        created.IsActive.Should().BeTrue();

        var listResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks"
        );
        var webhooks = await listResponse.Content.ReadFromJsonAsync<
            IReadOnlyList<WebhookSubscriptionResponse>
        >(ApiTestHelpers.JsonOptions);

        webhooks.Should().ContainSingle(w => w.Id == created.Id);
    }

    [Fact]
    public async Task DeleteWebhook_RemovesSubscription()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/notifications/webhooks",
                new CreateWebhookSubscription.Command
                {
                    ProjectId = Guid.Empty,
                    Url = "https://example.com/hook",
                    Events = ["run.completed"],
                }
            )
        ).Content.ReadFromJsonAsync<WebhookSubscriptionResponse>(ApiTestHelpers.JsonOptions);

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks/{created!.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var webhooks = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/notifications/webhooks")
        ).Content.ReadFromJsonAsync<IReadOnlyList<WebhookSubscriptionResponse>>(
            ApiTestHelpers.JsonOptions
        );
        webhooks.Should().NotContain(w => w.Id == created.Id);
    }

    [Fact]
    public async Task CreateWebhook_InvalidUrl_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks",
            new CreateWebhookSubscription.Command
            {
                ProjectId = Guid.Empty,
                Url = "not-a-url",
                Events = ["run.completed"],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task CreateWebhook_EmptyEvents_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks",
            new CreateWebhookSubscription.Command
            {
                ProjectId = Guid.Empty,
                Url = "https://example.com/hook",
                Events = [],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task CreateWebhook_NonHttpScheme_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks",
            new CreateWebhookSubscription.Command
            {
                ProjectId = Guid.Empty,
                Url = "ftp://example.com/hook",
                Events = ["run.completed"],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task CreateEmail_Then_GetAll_ReturnsSubscription()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/emails",
            new CreateEmailSubscription.Command
            {
                ProjectId = Guid.Empty,
                Email = "ci@example.com",
                Events = ["run.completed"],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var created = await response.Content.ReadFromJsonAsync<EmailSubscriptionResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Email.Should().Be("ci@example.com");

        var emails = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/notifications/emails")
        ).Content.ReadFromJsonAsync<IReadOnlyList<EmailSubscriptionResponse>>(
            ApiTestHelpers.JsonOptions
        );
        emails.Should().ContainSingle(e => e.Id == created.Id);
    }

    [Fact]
    public async Task DeleteEmail_RemovesSubscription()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/notifications/emails",
                new CreateEmailSubscription.Command
                {
                    ProjectId = Guid.Empty,
                    Email = "delete-me@example.com",
                    Events = ["run.completed"],
                }
            )
        ).Content.ReadFromJsonAsync<EmailSubscriptionResponse>(ApiTestHelpers.JsonOptions);

        await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/notifications/emails/{created!.Id}"
        );

        var emails = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/notifications/emails")
        ).Content.ReadFromJsonAsync<IReadOnlyList<EmailSubscriptionResponse>>(
            ApiTestHelpers.JsonOptions
        );
        emails.Should().NotContain(e => e.Id == created.Id);
    }

    [Fact]
    public async Task CreateEmail_InvalidEmail_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/emails",
            new CreateEmailSubscription.Command
            {
                ProjectId = Guid.Empty,
                Email = "not-an-email",
                Events = ["run.completed"],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateEmail_EmptyEvents_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/emails",
            new CreateEmailSubscription.Command
            {
                ProjectId = Guid.Empty,
                Email = "ci@example.com",
                Events = [],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task GetWebhooks_OtherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());

        var project = await owner.CreateProjectAsync();

        var response = await other.GetAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks"
        );
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateWebhook_ChangesUrlEventsAndActiveState()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/notifications/webhooks",
                new CreateWebhookSubscription.Command
                {
                    ProjectId = Guid.Empty,
                    Url = "https://example.com/hook",
                    Events = ["run.completed"],
                }
            )
        ).Content.ReadFromJsonAsync<WebhookSubscriptionResponse>(ApiTestHelpers.JsonOptions);

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks/{created!.Id}",
            new UpdateWebhookSubscription.Command
            {
                ProjectId = Guid.Empty,
                Url = "https://example.com/updated-hook",
                Events = ["run.completed", "run.failed"],
                IsActive = false,
            }
        );

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<WebhookSubscriptionResponse>(
            ApiTestHelpers.JsonOptions
        );
        updated!.Url.Should().Be("https://example.com/updated-hook");
        IReadOnlyList<string> expectedWebhookEvents = ["run.completed", "run.failed"];
        updated.Events.Should().BeEquivalentTo(expectedWebhookEvents);
        updated.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateWebhook_NonExistentSubscription_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks/{Guid.NewGuid()}",
            new UpdateWebhookSubscription.Command
            {
                ProjectId = Guid.Empty,
                Url = "https://example.com/hook",
                Events = ["run.completed"],
                IsActive = true,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task UpdateWebhook_EmptyEvents_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/notifications/webhooks",
                new CreateWebhookSubscription.Command
                {
                    ProjectId = Guid.Empty,
                    Url = "https://example.com/hook",
                    Events = ["run.completed"],
                }
            )
        ).Content.ReadFromJsonAsync<WebhookSubscriptionResponse>(ApiTestHelpers.JsonOptions);

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks/{created!.Id}",
            new UpdateWebhookSubscription.Command
            {
                ProjectId = Guid.Empty,
                Url = "https://example.com/hook",
                Events = [],
                IsActive = true,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task UpdateWebhook_NonHttpScheme_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/notifications/webhooks",
                new CreateWebhookSubscription.Command
                {
                    ProjectId = Guid.Empty,
                    Url = "https://example.com/hook",
                    Events = ["run.completed"],
                }
            )
        ).Content.ReadFromJsonAsync<WebhookSubscriptionResponse>(ApiTestHelpers.JsonOptions);

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/webhooks/{created!.Id}",
            new UpdateWebhookSubscription.Command
            {
                ProjectId = Guid.Empty,
                Url = "ftp://example.com/hook",
                Events = ["run.completed"],
                IsActive = true,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task UpdateEmail_ChangesEmailEventsAndActiveState()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/notifications/emails",
                new CreateEmailSubscription.Command
                {
                    ProjectId = Guid.Empty,
                    Email = "ci@example.com",
                    Events = ["run.completed"],
                }
            )
        ).Content.ReadFromJsonAsync<EmailSubscriptionResponse>(ApiTestHelpers.JsonOptions);

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/emails/{created!.Id}",
            new UpdateEmailSubscription.Command
            {
                ProjectId = Guid.Empty,
                Email = "updated@example.com",
                Events = ["run.completed", "run.failed"],
                IsActive = false,
            }
        );

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<EmailSubscriptionResponse>(
            ApiTestHelpers.JsonOptions
        );
        updated!.Email.Should().Be("updated@example.com");
        IReadOnlyList<string> expectedEmailEvents = ["run.completed", "run.failed"];
        updated.Events.Should().BeEquivalentTo(expectedEmailEvents);
        updated.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateEmail_NonExistentSubscription_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/emails/{Guid.NewGuid()}",
            new UpdateEmailSubscription.Command
            {
                ProjectId = Guid.Empty,
                Email = "ci@example.com",
                Events = ["run.completed"],
                IsActive = true,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task UpdateEmail_EmptyEvents_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/notifications/emails",
                new CreateEmailSubscription.Command
                {
                    ProjectId = Guid.Empty,
                    Email = "ci@example.com",
                    Events = ["run.completed"],
                }
            )
        ).Content.ReadFromJsonAsync<EmailSubscriptionResponse>(ApiTestHelpers.JsonOptions);

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/emails/{created!.Id}",
            new UpdateEmailSubscription.Command
            {
                ProjectId = Guid.Empty,
                Email = "ci@example.com",
                Events = [],
                IsActive = true,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task UpdateEmail_InvalidEmail_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/notifications/emails",
                new CreateEmailSubscription.Command
                {
                    ProjectId = Guid.Empty,
                    Email = "ci@example.com",
                    Events = ["run.completed"],
                }
            )
        ).Content.ReadFromJsonAsync<EmailSubscriptionResponse>(ApiTestHelpers.JsonOptions);

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/emails/{created!.Id}",
            new UpdateEmailSubscription.Command
            {
                ProjectId = Guid.Empty,
                Email = "not-an-email",
                Events = ["run.completed"],
                IsActive = true,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }
}
