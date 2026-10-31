using System.Text.RegularExpressions;
using TestCraft.Api.Configuration.Controllers;

namespace TestCraft.Api.Errors;

public static partial class ValidationErrors
{
    private const string FieldRequired = "Field required";

    public static FieldError ForMember(HttpRequest request, string memberPath, string message)
    {
        var segments = Segments(WireFormat.FieldName(memberPath));

        return HasBody(request) ? Body(segments, message) : Query(segments, message);
    }

    public static FieldError MissingHeader(string name)
    {
        var header = name.ToLowerInvariant();

        return new FieldError(header, FieldRequired) { Location = ["header", header] };
    }

    public static IEnumerable<FieldError> ForModelState(string key, string message)
    {
        if (key.Length == 0)
        {
            yield return new FieldError("body", FieldRequired) { Pointer = "#" };
            yield break;
        }

        if (!key.StartsWith('$'))
        {
            yield return Query(Segments(WireFormat.FieldName(key)), message);
            yield break;
        }

        var segments = Segments(key.TrimStart('$').TrimStart('.'));

        if (MissingRequiredPattern().Match(message) is { Success: true } missing)
        {
            foreach (Capture name in missing.Groups["name"].Captures)
            {
                yield return Body([.. segments, name.Value], FieldRequired);
            }

            yield break;
        }

        if (message.Contains("could not be mapped to any .NET member", StringComparison.Ordinal))
        {
            yield return Body(segments, "Extra inputs are not permitted");
            yield break;
        }

        if (ConversionPattern().Match(message) is { Success: true } conversion)
        {
            yield return Body(
                segments,
                $"Input should be {Describe(conversion.Groups["type"].Value)}"
            );
            yield break;
        }

        yield return new FieldError("body", "JSON decode error") { Location = ["body"] };
    }

    public static string Summary(IEnumerable<FieldError> errors) =>
        string.Join("; ", errors.Select(error => $"{error.Field}: {error.Message}"));

    private static FieldError Body(IReadOnlyList<string> segments, string message) =>
        new(string.Join('.', segments), message)
        {
            Pointer =
                "#"
                + string.Concat(
                    segments.Select(s => "/" + s.Replace("~", "~0").Replace("/", "~1"))
                ),
        };

    private static FieldError Query(IReadOnlyList<string> segments, string message) =>
        new(string.Join('.', segments), message) { Location = ["query", .. segments] };

    private static bool HasBody(HttpRequest request) =>
        (
            HttpMethods.IsPost(request.Method)
            || HttpMethods.IsPut(request.Method)
            || HttpMethods.IsPatch(request.Method)
        ) && request.HasJsonContentType();

    private static string[] Segments(string path) =>
        path.Replace("[", ".").Replace("]", "").Split('.', StringSplitOptions.RemoveEmptyEntries);

    private static string Describe(string type) =>
        NullablePattern().Replace(type, "$1") switch
        {
            "System.String" => "a valid string",
            "System.Boolean" => "a valid boolean",
            "System.Int16" or "System.Int32" or "System.Int64" => "a valid integer",
            "System.Single" or "System.Double" or "System.Decimal" => "a valid number",
            "System.Guid" => "a valid UUID",
            "System.DateTime" or "System.DateTimeOffset" => "a valid datetime",
            "System.DateOnly" => "a valid date",
            var name
                when name.StartsWith("TestCraft.", StringComparison.Ordinal)
                    && name.EndsWith("Id", StringComparison.Ordinal) => "a valid UUID",
            var name
                when name.StartsWith("System.Collections", StringComparison.Ordinal)
                    || name.EndsWith("[]", StringComparison.Ordinal) => "a valid list",
            _ => "a valid value",
        };

    [GeneratedRegex(@"^System\.Nullable`1\[(.+)\]$")]
    private static partial Regex NullablePattern();

    [GeneratedRegex(@"missing required properties including: (?:'(?<name>[^']+)'(?:, )?)+")]
    private static partial Regex MissingRequiredPattern();

    [GeneratedRegex(@"could not be converted to (?<type>[^\s.]+(?:\.[^\s.]+)*?)\.?(?: Path:|$)")]
    private static partial Regex ConversionPattern();
}
