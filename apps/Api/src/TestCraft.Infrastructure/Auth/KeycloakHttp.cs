namespace TestCraft.Infrastructure.Auth;

public static class KeycloakHttp
{
    public static HttpMessageHandler CreateHandler(bool verifyTls) =>
        verifyTls
            ? new SocketsHttpHandler()
            : new SocketsHttpHandler
            {
#pragma warning disable S4830, CA5359
                SslOptions = { RemoteCertificateValidationCallback = (_, _, _, _) => true },
#pragma warning restore S4830, CA5359
            };
}
