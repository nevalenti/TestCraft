using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting.Internal;
using Microsoft.Extensions.Logging.Abstractions;
using TestCraft.Api.Errors;
using TestCraft.Persistence;

namespace TestCraft.Api.IntegrationTests.Contracts;

public class GlobalExceptionHandlerTests
{
    [Theory]
    [InlineData(StatusCodes.Status400BadRequest)]
    [InlineData(StatusCodes.Status408RequestTimeout)]
    [InlineData(StatusCodes.Status413PayloadTooLarge)]
    public async Task BadHttpRequest_KeepsItsStatusCode(int statusCode)
    {
        var handler = new GlobalExceptionHandler(
            NullLogger<GlobalExceptionHandler>.Instance,
            new PostgresExceptionClassifier(),
            new HostingEnvironment { EnvironmentName = "Testing" }
        );
        var context = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection().AddOptions().BuildServiceProvider(),
            Response = { Body = new MemoryStream() },
        };

        var handled = await handler.TryHandleAsync(
            context,
            new BadHttpRequestException("bad request", statusCode),
            CancellationToken.None
        );

        handled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(statusCode);
        context.Response.ContentType.Should().StartWith("application/problem+json");
        context.Response.Body.Position = 0;
        using var body = await JsonDocument.ParseAsync(context.Response.Body);
        body.RootElement.GetProperty("status").GetInt32().Should().Be(statusCode);
    }
}
