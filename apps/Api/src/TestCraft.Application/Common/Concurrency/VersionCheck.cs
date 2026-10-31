using TestCraft.Application.Common.Exceptions;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Common.Concurrency;

public static class VersionCheck
{
    public static void Ensure(IVersioned entity, int? expectedVersion)
    {
        if (expectedVersion is { } expected && entity.Version != expected)
        {
            throw new PreconditionFailedException(
                $"This was changed by someone else (now version {entity.Version}, "
                    + $"you sent {expected}); reload it and try again"
            );
        }
    }
}
