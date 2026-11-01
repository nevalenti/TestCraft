using System.Collections.Concurrent;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

public sealed class FakeEmailService : IEmailService
{
    private readonly ConcurrentQueue<SentEmail> _sent = new();

    public IReadOnlyCollection<SentEmail> Sent => _sent;

    public Task SendAsync(
        string recipient,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default
    )
    {
        _sent.Enqueue(new SentEmail(recipient, subject, htmlBody));

        return Task.CompletedTask;
    }

    public sealed record SentEmail(string Recipient, string Subject, string HtmlBody);
}
