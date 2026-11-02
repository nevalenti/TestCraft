using System.Net;
using System.Reflection;

namespace TestCraft.Infrastructure.Notifications;

internal static class RunCompletedEmail
{
    private const string ResourceName =
        "TestCraft.Infrastructure.Notifications.Templates.run_completed.html";

    private static readonly Lazy<string> Template = new(LoadTemplate);

    public static string Subject(string runName) => $"[TestCraft] {runName} — run.completed";

    public static string Body(string runName, string runUrl) =>
        Template
            .Value.Replace("{{run_url}}", WebUtility.HtmlEncode(runUrl), StringComparison.Ordinal)
            .Replace("{{run_name}}", WebUtility.HtmlEncode(runName), StringComparison.Ordinal);

    private static string LoadTemplate()
    {
        using var stream =
            Assembly.GetExecutingAssembly().GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException($"Missing embedded resource {ResourceName}");
        using var reader = new StreamReader(stream);

        return reader.ReadToEnd();
    }
}
