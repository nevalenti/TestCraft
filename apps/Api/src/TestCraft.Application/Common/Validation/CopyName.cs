namespace TestCraft.Application.Common.Validation;

public static class CopyName
{
    public static string FirstFree(string name, IReadOnlySet<string> taken)
    {
        if (!taken.Contains(name))
        {
            return name;
        }

        var attempt = 1;
        string candidate;
        do
        {
            var suffix = attempt == 1 ? " (copy)" : $" (copy {attempt})";
            candidate = Truncate(name, FieldLengths.Name - suffix.Length) + suffix;
            attempt++;
        } while (taken.Contains(candidate));

        return candidate;
    }

    private static string Truncate(string value, int length) =>
        value.Length <= length ? value : value[..length];
}
