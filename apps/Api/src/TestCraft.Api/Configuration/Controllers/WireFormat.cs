using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TestCraft.Api.Configuration.Controllers;

public static class WireFormat
{
    public static readonly JsonNamingPolicy NamingPolicy = JsonNamingPolicy.SnakeCaseLower;

    public static void Configure(JsonSerializerOptions options)
    {
        options.PropertyNamingPolicy = NamingPolicy;
        options.DictionaryKeyPolicy = null;
        options.Converters.Add(
            new JsonStringEnumConverter(NamingPolicy, allowIntegerValues: false)
        );
    }

    public static string EnumName(Enum value)
    {
        var name = value.ToString();
        var member = value.GetType().GetField(name);

        return member?.GetCustomAttribute<JsonStringEnumMemberNameAttribute>()?.Name
            ?? NamingPolicy.ConvertName(name);
    }

    public static string FieldName(string path)
    {
        if (string.IsNullOrEmpty(path))
        {
            return path;
        }

        var segments = path.Split('.');
        for (var i = 0; i < segments.Length; i++)
        {
            var segment = segments[i];
            var bracketIndex = segment.IndexOf('[');
            segments[i] =
                bracketIndex < 0
                    ? NamingPolicy.ConvertName(segment)
                    : NamingPolicy.ConvertName(segment[..bracketIndex]) + segment[bracketIndex..];
        }

        return string.Join('.', segments);
    }
}
