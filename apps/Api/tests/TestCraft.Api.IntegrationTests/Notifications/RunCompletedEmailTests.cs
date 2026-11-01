using System.Net.Http.Headers;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Features.Notifications;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.Notifications;

[Collection(ApiCollection.Name)]
public class RunCompletedEmailTests(ApiFactory factory)
{
    [Fact]
    public async Task CompletingARun_EmailsSubscribersWithTheTemplate()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            Guid.NewGuid().ToString()
        );
        var project = await client.CreateProjectAsync();
        var recipient = $"{Guid.NewGuid()}@example.com";
        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/notifications/emails",
            new CreateEmailSubscription.Command
            {
                Email = recipient,
                Events = [NotificationEvent.RunCompleted],
            }
        );
        var run = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/runs",
                new CreateTestRun.Command { Name = "<b>Nightly</b> & co", Environment = "ci" }
            )
        ).Content.ReadFromJsonAsync<TestRunResponse>();

        await client.CompleteRunAsync(project.Id, run!);
        var email = await WaitForEmailAsync(recipient);

        email.Subject.Should().Be("[TestCraft] <b>Nightly</b> & co — run.completed");
        email.HtmlBody.Should().Contain("&lt;b&gt;Nightly&lt;/b&gt; &amp; co");
        email.HtmlBody.Should().NotContain("<b>Nightly</b>");
        email.HtmlBody.Should().Contain($"/projects/{project.Id}/runs/{run!.Id}");
        email.HtmlBody.Should().NotContain("{{");
    }

    private async Task<FakeEmailService.SentEmail> WaitForEmailAsync(string recipient)
    {
        var outbox = factory.Services.GetRequiredService<FakeEmailService>();
        var deadline = DateTime.UtcNow + TimeSpan.FromSeconds(10);
        while (DateTime.UtcNow < deadline)
        {
            var sent = outbox.Sent.FirstOrDefault(email => email.Recipient == recipient);
            if (sent is not null)
            {
                return sent;
            }

            await Task.Delay(50);
        }

        throw new TimeoutException($"No email was sent to {recipient}");
    }
}
