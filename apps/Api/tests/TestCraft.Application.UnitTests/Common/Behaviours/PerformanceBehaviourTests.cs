using FluentAssertions;

using MediatR;

using Microsoft.Extensions.Logging.Abstractions;

using TestCraft.Application.Common.Behaviours;

namespace TestCraft.Application.UnitTests.Common.Behaviours;

public class PerformanceBehaviourTests
{
    private sealed record TestRequest(string Name) : IRequest<string>;

    [Fact]
    public async Task Handle_InvokesNext_ReturnsResponse()
    {
        var behaviour = new PerformanceBehaviour<TestRequest, string>(
            NullLogger<PerformanceBehaviour<TestRequest, string>>.Instance
        );

        var result = await behaviour.Handle(
            new TestRequest("anything"),
            PipelineTestHelpers.NextReturning("next-called"),
            CancellationToken.None
        );

        result.Should().Be("next-called");
    }

    [Fact]
    public async Task Handle_NextThrows_PropagatesException()
    {
        var behaviour = new PerformanceBehaviour<TestRequest, string>(
            NullLogger<PerformanceBehaviour<TestRequest, string>>.Instance
        );

        var act = () =>
            behaviour.Handle(
                new TestRequest("anything"),
                _ => throw new InvalidOperationException("handler failed"),
                CancellationToken.None
            );

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
