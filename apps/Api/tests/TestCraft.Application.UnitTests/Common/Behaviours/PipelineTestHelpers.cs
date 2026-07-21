using MediatR;

namespace TestCraft.Application.UnitTests.Common.Behaviours;

internal static class PipelineTestHelpers
{
    public static RequestHandlerDelegate<TResponse> NextReturning<TResponse>(TResponse value) =>
        _ => Task.FromResult(value);
}
