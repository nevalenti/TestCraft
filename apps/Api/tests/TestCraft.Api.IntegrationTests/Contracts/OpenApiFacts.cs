using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace TestCraft.Api.IntegrationTests.Contracts;

public static partial class OpenApiFacts
{
    private static readonly string[] Methods = ["get", "post", "put", "patch", "delete"];

    private static readonly HashSet<string> KeptFormats = ["uuid", "date-time", "date", "binary"];

    public static SortedSet<string> From(JsonNode document)
    {
        var facts = new SortedSet<string>(StringComparer.Ordinal);
        var schemas = document["components"]?["schemas"]?.AsObject();

        foreach (var (rawPath, pathItem) in document["paths"]!.AsObject())
        {
            var path = PathParameter().Replace(rawPath, "{}").TrimEnd('/');

            foreach (var method in Methods)
            {
                if (pathItem![method] is not JsonObject operation)
                {
                    continue;
                }

                var name = $"{method.ToUpperInvariant()} {path}";
                facts.Add(name);
                var walker = new SchemaWalker(schemas, facts);

                foreach (var parameter in Parameters(pathItem, operation))
                {
                    var location = parameter["in"]!.GetValue<string>();
                    if (location == "path")
                    {
                        continue;
                    }

                    var parameterName = parameter["name"]!.GetValue<string>();
                    if (location == "header")
                    {
                        parameterName = parameterName.ToLowerInvariant();
                    }

                    var required = parameter["required"]?.GetValue<bool>() == true;
                    walker.Parameter(
                        $"{name} {location} {parameterName}",
                        parameter["schema"],
                        required
                    );
                }

                if (operation["requestBody"]?["content"] is JsonObject requestContent)
                {
                    foreach (var (contentType, media) in RelevantContent(requestContent))
                    {
                        walker.Walk($"{name} body ({contentType}) $", media?["schema"], true);
                    }
                }

                foreach (var (status, response) in operation["responses"]!.AsObject())
                {
                    if (!status.StartsWith('2'))
                    {
                        continue;
                    }

                    var content = (response?["content"] as JsonObject) ?? [];
                    var relevant = RelevantContent(content).ToList();
                    if (relevant.Count == 0)
                    {
                        facts.Add($"{name} -> {status} (no body)");
                        continue;
                    }

                    foreach (var (contentType, media) in relevant)
                    {
                        facts.Add($"{name} -> {status} ({contentType})");
                        if (contentType.EndsWith("json", StringComparison.Ordinal))
                        {
                            walker.Walk($"{name} -> {status} $", media?["schema"], true);
                        }
                    }
                }
            }
        }

        return facts;
    }

    private static IEnumerable<JsonNode> Parameters(JsonNode pathItem, JsonObject operation) =>
        (pathItem["parameters"]?.AsArray() ?? [])
            .Concat(operation["parameters"]?.AsArray() ?? [])
            .OfType<JsonNode>();

    private static IEnumerable<KeyValuePair<string, JsonNode?>> RelevantContent(
        JsonObject content
    ) =>
        content.Where(entry =>
            !(
                content.ContainsKey("application/json")
                && entry.Key is "text/plain" or "text/json" or "application/*+json"
            )
        );

    [GeneratedRegex(@"\{[^}]+\}")]
    private static partial Regex PathParameter();

    private sealed class SchemaWalker(JsonObject? schemas, SortedSet<string> facts)
    {
        private readonly Stack<string> _refs = new();

        public void Parameter(string prefix, JsonNode? schema, bool required)
        {
            var (resolved, nullable, _) = Resolve(schema);
            facts.Add($"{prefix}: {Describe(resolved)}{Suffix(nullable && required, required)}");
        }

        public void Walk(string prefix, JsonNode? schema, bool required)
        {
            var (resolved, nullable, reference) = Resolve(schema);
            if (reference is not null && _refs.Contains(reference))
            {
                facts.Add($"{prefix}: recursive {reference}{Suffix(nullable, required)}");
                return;
            }

            if (reference is not null)
            {
                _refs.Push(reference);
            }

            facts.Add($"{prefix}: {Describe(resolved)}{Suffix(nullable, required)}");

            if (resolved?["properties"] is JsonObject properties)
            {
                var requiredNames = (resolved["required"]?.AsArray() ?? [])
                    .Select(node => node!.GetValue<string>())
                    .ToHashSet();
                foreach (var (property, propertySchema) in properties)
                {
                    Walk($"{prefix}.{property}", propertySchema, requiredNames.Contains(property));
                }
            }
            else if (resolved?["items"] is { } items)
            {
                Walk($"{prefix}[]", items, true);
            }
            else if (resolved?["additionalProperties"] is JsonObject values)
            {
                Walk($"{prefix}{{*}}", values, true);
            }

            if (reference is not null)
            {
                _refs.Pop();
            }
        }

        private (JsonNode? Schema, bool Nullable, string? Reference) Resolve(JsonNode? schema)
        {
            var nullable = false;
            string? reference = null;

            for (var depth = 0; depth < 16 && schema is JsonObject node; depth++)
            {
                if (node["nullable"]?.GetValue<bool>() == true)
                {
                    nullable = true;
                }

                if (node["$ref"] is { } refNode)
                {
                    reference = refNode.GetValue<string>().Split('/')[^1];
                    schema = schemas?[reference];
                    continue;
                }

                var variants = (node["anyOf"] ?? node["oneOf"])?.AsArray();
                if (variants is not null)
                {
                    var nonNull = variants
                        .Where(variant => variant?["type"]?.ToString() != "null")
                        .ToList();
                    nullable |= nonNull.Count < variants.Count;
                    if (nonNull.Count == 1)
                    {
                        schema = nonNull[0];
                        continue;
                    }
                }

                if (node["allOf"]?.AsArray() is [var single])
                {
                    schema = single;
                    continue;
                }

                break;
            }

            if (schema?["type"] is JsonArray types)
            {
                nullable |= types.Any(type => type?.GetValue<string>() == "null");
            }

            return (schema, nullable, reference);
        }

        private string Describe(JsonNode? schema)
        {
            if (schema is null)
            {
                return "any";
            }

            if ((schema["anyOf"] ?? schema["oneOf"])?.AsArray() is { } variants)
            {
                var options = variants
                    .Where(variant => variant?["type"]?.ToString() != "null")
                    .Select(variant => Describe(Resolve(variant).Schema))
                    .Order(StringComparer.Ordinal);
                return $"oneOf[{string.Join(" | ", options)}]";
            }

            var type = schema["type"] switch
            {
                JsonArray types => types
                    .Select(node => node!.GetValue<string>())
                    .FirstOrDefault(name => name != "null")
                    ?? "null",
                JsonValue value => value.GetValue<string>(),
                _ => schema["properties"] is not null ? "object" : "any",
            };

            var format =
                schema["format"]?.GetValue<string>()
                ?? (schema["contentMediaType"] is not null ? "binary" : null);
            var description =
                format is not null && KeptFormats.Contains(format) ? $"{type}({format})" : type;

            if (schema["enum"]?.AsArray() is { } values)
            {
                var members = values
                    .Where(value => value is not null)
                    .Select(value => value!.ToString())
                    .Order(StringComparer.Ordinal);
                description += $" enum[{string.Join(", ", members)}]";
            }

            return description;
        }

        private static string Suffix(bool nullable, bool required) =>
            (nullable ? "?" : "") + (required ? "" : " (optional)");
    }
}
