using System.Text.Json;

namespace TestCraft.Api.Errors;

public static class FieldNameConverter
{
    public static string ToCamelCase(string key)
    {
        if (string.IsNullOrEmpty(key))
        {
            return key;
        }

        var segments = key.Split('.');
        for (var i = 0; i < segments.Length; i++)
        {
            var segment = segments[i];
            var bracketIndex = segment.IndexOf('[');
            segments[i] =
                bracketIndex < 0
                    ? JsonNamingPolicy.CamelCase.ConvertName(segment)
                    : JsonNamingPolicy.CamelCase.ConvertName(
                        segment[..bracketIndex]
                    ) + segment[bracketIndex..];
        }

        return string.Join('.', segments);
    }
}
