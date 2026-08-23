using System.Diagnostics;

using MediatR;

using Microsoft.Extensions.Logging;

namespace TestCraft.Application.Common.Behaviours;

public partial class PerformanceBehaviour<TRequest, TResponse>(
    ILogger<PerformanceBehaviour<TRequest, TResponse>> logger
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private const long SlowRequestThresholdMilliseconds = 500;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var startTimestamp = Stopwatch.GetTimestamp();

        var response = await next(cancellationToken);

        var elapsedMilliseconds = (long)Stopwatch.GetElapsedTime(startTimestamp).TotalMilliseconds;

        if (elapsedMilliseconds > SlowRequestThresholdMilliseconds)
        {
            LogSlowRequest(typeof(TRequest).Name, elapsedMilliseconds);
        }

        return response;
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Slow request: {RequestName} took {ElapsedMilliseconds}ms"
    )]
    private partial void LogSlowRequest(string requestName, long elapsedMilliseconds);
}
