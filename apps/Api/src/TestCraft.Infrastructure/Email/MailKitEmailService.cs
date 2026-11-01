using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Email;

public class MailKitEmailService(IOptions<InfrastructureOptions> options) : IEmailService
{
    public async Task SendAsync(
        string recipient,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default
    )
    {
        if (string.IsNullOrEmpty(options.Value.SmtpHost))
        {
            throw new InvalidOperationException(
                "MailKitEmailService requires SMTP_HOST to be configured."
            );
        }

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(options.Value.SmtpFromAddress));
        message.To.Add(MailboxAddress.Parse(recipient));
        message.Subject = subject;
        message.Body = new TextPart(MimeKit.Text.TextFormat.Html) { Text = htmlBody };

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(
                options.Value.SmtpHost,
                options.Value.SmtpPort,
                options.Value.SmtpStartTls
                    ? SecureSocketOptions.StartTls
                    : SecureSocketOptions.None,
                cancellationToken
            );

            if (!string.IsNullOrEmpty(options.Value.SmtpUser))
            {
                await client.AuthenticateAsync(
                    options.Value.SmtpUser,
                    options.Value.SmtpPassword ?? string.Empty,
                    cancellationToken
                );
            }

            await client.SendAsync(message, cancellationToken);
        }
        finally
        {
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true, cancellationToken);
            }
        }
    }
}
