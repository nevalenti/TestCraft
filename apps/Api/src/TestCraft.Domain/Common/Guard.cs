using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.Common;

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
