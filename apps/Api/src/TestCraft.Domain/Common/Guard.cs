using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.Common;

/// <summary>Shared invariant checks for entity factories and behavior methods.</summary>
internal static class Guard
{
    public static string AgainstEmpty(string value, string fieldName) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new DomainException($"{fieldName} is required")
            {
                ErrorCode = DomainErrorCodes.RequiredField,
            }
            : value;
}
