using System.Text.RegularExpressions;

namespace TestCraft.Domain.Entities;

public static partial class NoteExcerpt
{
    public const int Length = 200;

    public static string Build(string content, string language)
    {
        IEnumerable<string> lines = content.Split(["\r\n", "\n", "\r"], StringSplitOptions.None);
        if (language == "markdown")
        {
            lines = lines
                .Where(line => !line.TrimStart().StartsWith("```", StringComparison.Ordinal))
                .Select(line =>
                    Emphasis().Replace(Link().Replace(LinePrefix().Replace(line, ""), "$1"), "")
                );
        }

        var text = Whitespace().Replace(string.Join(' ', lines), " ").Trim();

        if (text.Length <= Length)
        {
            return text;
        }

        var end = char.IsHighSurrogate(text[Length - 1]) ? Length - 1 : Length;

        return text[..end];
    }

    [GeneratedRegex(@"^\s{0,3}(?:#{1,6}\s+|>\s?|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)")]
    private static partial Regex LinePrefix();

    [GeneratedRegex(@"!?\[([^\]]*)\]\([^)]*\)")]
    private static partial Regex Link();

    [GeneratedRegex(@"\*\*|__|~~|`")]
    private static partial Regex Emphasis();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();
}
