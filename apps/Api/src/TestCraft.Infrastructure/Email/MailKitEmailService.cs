using MailKit.Net.Smtp;
using MailKit.Security;

using MimeKit;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Email;

public class MailKitEmailService(InfrastructureOptions options) : IEmailService
{
    public async Task SendAsync(
        string recipient,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default
    )
    {
        if (string.IsNullOrEmpty(options.SmtpHost))
            throw new InvalidOperationException(
                "MailKitEmailService requires SMTP_HOST to be configured."
            );

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(options.SmtpFromAddress));
        message.To.Add(MailboxAddress.Parse(recipient));
        message.Subject = subject;
        message.Body = new TextPart(MimeKit.Text.TextFormat.Html) { Text = htmlBody };

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(
                options.SmtpHost,
                options.SmtpPort,
                SecureSocketOptions.StartTlsWhenAvailable,
                cancellationToken
            );

            if (!string.IsNullOrEmpty(options.SmtpUser))
                await client.AuthenticateAsync(
                    options.SmtpUser,
                    options.SmtpPassword ?? string.Empty,
                    cancellationToken
                );

            await client.SendAsync(message, cancellationToken);
        }
        finally
        {
            if (client.IsConnected)
                await client.DisconnectAsync(true, cancellationToken);
        }
    }
}
