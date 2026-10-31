namespace TestCraft.Application.Common.Exceptions;

public sealed class PreconditionFailedException(
    string message = "The resource has changed since it was read"
) : Exception(message);
