using System.Collections.Frozen;
using System.Text.RegularExpressions;
using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public static partial class ApiTokenScopes
{
    private static readonly FrozenDictionary<ApiTokenScope, string> Names =
        Enum.GetValues<ApiTokenScope>()
            .ToFrozenDictionary(
                scope => scope,
                scope => WordBoundary().Replace(scope.ToString(), "_$1").ToLowerInvariant()
            );

    private static readonly FrozenDictionary<string, ApiTokenScope> ByName =
        Names.ToFrozenDictionary(entry => entry.Value, entry => entry.Key, StringComparer.Ordinal);

    public static string Name(this ApiTokenScope scope) => Names[scope];

    public static ApiTokenScope Parse(string name) => ByName[name];

    public static bool Grants(IEnumerable<string> scopes, string resource, bool write) =>
        scopes.Contains($"{resource}_write", StringComparer.Ordinal)
        || (!write && scopes.Contains($"{resource}_read", StringComparer.Ordinal));

    [GeneratedRegex("(?<!^)([A-Z])")]
    private static partial Regex WordBoundary();
}
