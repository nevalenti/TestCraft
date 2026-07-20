using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Infrastructure.Email;

public class NoOpEmailService : IEmailService
{
    public Task SendAsync(
        string recipient,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;
}
