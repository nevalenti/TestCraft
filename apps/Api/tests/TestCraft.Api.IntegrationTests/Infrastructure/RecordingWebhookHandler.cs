using System.Collections.Concurrent;
using System.Net;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

public sealed class RecordingWebhookHandler : HttpMessageHandler
{
    private readonly ConcurrentQueue<RecordedRequest> _requests = new();
    private int _inFlight;
    private int _maxInFlight;

    public Func<Uri, HttpStatusCode> Respond { get; set; } = _ => HttpStatusCode.OK;

    public TimeSpan Delay { get; set; }

    public IReadOnlyCollection<RecordedRequest> Requests => _requests;

    public int MaxInFlight => _maxInFlight;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken
    )
    {
        var current = Interlocked.Increment(ref _inFlight);
        int seen;
        while (current > (seen = _maxInFlight))
        {
            Interlocked.CompareExchange(ref _maxInFlight, current, seen);
        }

        try
        {
            var body = await request.Content!.ReadAsStringAsync(cancellationToken);
            var headers = request.Headers.ToDictionary(
                header => header.Key,
                header => header.Value.First(),
                StringComparer.OrdinalIgnoreCase
            );
            _requests.Enqueue(new RecordedRequest(request.RequestUri!, headers, body));

            if (Delay > TimeSpan.Zero)
            {
                await Task.Delay(Delay, cancellationToken);
            }

            return new HttpResponseMessage(Respond(request.RequestUri!));
        }
        finally
        {
            Interlocked.Decrement(ref _inFlight);
        }
    }

    public sealed record RecordedRequest(
        Uri Url,
        IReadOnlyDictionary<string, string> Headers,
        string Body
    );
}
