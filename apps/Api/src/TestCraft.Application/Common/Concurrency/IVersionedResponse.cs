namespace TestCraft.Application.Common.Concurrency;

public interface IVersionedResponse
{
    int Version { get; }
}
