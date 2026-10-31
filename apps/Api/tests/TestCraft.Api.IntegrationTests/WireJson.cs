using System.Net.Http.Json;
using System.Text.Json;
using TestCraft.Api.Configuration.Controllers;

namespace TestCraft.Api.IntegrationTests;

public static class WireJson
{
    public static readonly JsonSerializerOptions Options = CreateOptions();

    public static JsonContent Content<T>(T value) => JsonContent.Create(value, options: Options);

    public static Task<HttpResponseMessage> PostAsJsonAsync<T>(
        this HttpClient client,
        string? requestUri,
        T value,
        CancellationToken cancellationToken = default
    ) => client.PostAsync(requestUri, Content(value), cancellationToken);

    public static Task<HttpResponseMessage> PutAsJsonAsync<T>(
        this HttpClient client,
        string? requestUri,
        T value,
        CancellationToken cancellationToken = default
    ) => client.PutAsync(requestUri, Content(value), cancellationToken);

    public static Task<HttpResponseMessage> UpdateAsJsonAsync<T>(
        this HttpClient client,
        string? requestUri,
        T value,
        int version = 1,
        CancellationToken cancellationToken = default
    )
    {
        var request = new HttpRequestMessage(HttpMethod.Put, requestUri)
        {
            Content = Content(value),
        };
        request.Headers.TryAddWithoutValidation("If-Match", $"\"{version}\"");

        return client.SendAsync(request, cancellationToken);
    }

    public static Task<T?> ReadFromJsonAsync<T>(
        this HttpContent content,
        CancellationToken cancellationToken = default
    ) => content.ReadFromJsonAsync<T>(Options, cancellationToken);

    private static JsonSerializerOptions CreateOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        WireFormat.Configure(options);

        return options;
    }
}
