namespace TestCraft.Application.Common.Validation;

/// <summary>Shared maximum lengths for short, freeform text fields, matching the database column sizes.</summary>
public static class FieldLengths
{
    /// <summary>Max length for a name, environment, file name, or similar short identifying field.</summary>
    public const int Name = 255;
}
