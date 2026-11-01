using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Nodes;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;

namespace TestCraft.Api.IntegrationTests.Contracts;

[Collection(ApiCollection.Name)]
public class ValidationProblemTests(ApiFactory factory)
{
    private HttpClient CreateClient()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            Guid.NewGuid().ToString()
        );

        return client;
    }

    private async Task<JsonObject> CreateProjectWithBody(string body)
    {
        var response = await CreateClient()
            .PostAsync(
                "/api/v1/projects",
                new StringContent(body, Encoding.UTF8, "application/json")
            );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");

        return JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
    }

    private static JsonNode OnlyError(JsonObject problem) =>
        problem["errors"]!.AsArray().Should().ContainSingle().Subject!;

    [Fact]
    public async Task UnknownBodyField_IsRejectedWithAPointer()
    {
        var problem = await CreateProjectWithBody("""{"name":"x","bogus":1}""");

        problem["title"]!.GetValue<string>().Should().Be("Validation Failed");
        problem["detail"]!.GetValue<string>().Should().Be("bogus: Extra inputs are not permitted");
        var error = OnlyError(problem);
        error["field"]!.GetValue<string>().Should().Be("bogus");
        error["pointer"]!.GetValue<string>().Should().Be("#/bogus");
    }

    [Fact]
    public async Task MissingRequiredField_IsReportedByWireName()
    {
        var error = OnlyError(await CreateProjectWithBody("{}"));

        error["field"]!.GetValue<string>().Should().Be("name");
        error["message"]!.GetValue<string>().Should().Be("Field required");
        error["pointer"]!.GetValue<string>().Should().Be("#/name");
    }

    [Fact]
    public async Task WrongType_DoesNotMentionDotNetTypes()
    {
        var error = OnlyError(await CreateProjectWithBody("""{"name":5}"""));

        error["field"]!.GetValue<string>().Should().Be("name");
        error["message"]!.GetValue<string>().Should().Be("Input should be a valid string");
    }

    [Fact]
    public async Task MalformedJson_IsAJsonDecodeError()
    {
        var error = OnlyError(await CreateProjectWithBody("""{"name":"""));

        error["field"]!.GetValue<string>().Should().Be("body");
        error["location"]!
            .AsArray()
            .Select(part => part!.GetValue<string>())
            .Should()
            .Equal("body");
    }

    [Fact]
    public async Task ValidatorFailure_NamesTheFieldAsSent()
    {
        var error = OnlyError(await CreateProjectWithBody("""{"name":""}"""));

        error["pointer"]!.GetValue<string>().Should().Be("#/name");
        error["message"]!.GetValue<string>().Should().Contain("'name'");
    }

    [Fact]
    public async Task InvalidQueryValue_CarriesItsLocation()
    {
        var response = await CreateClient().GetAsync("/api/v1/projects?page=abc");

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var error = OnlyError(
            JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject()
        );
        error["field"]!.GetValue<string>().Should().Be("page");
        error["location"]!
            .AsArray()
            .Select(part => part!.GetValue<string>())
            .Should()
            .Equal("query", "page");
    }
}
