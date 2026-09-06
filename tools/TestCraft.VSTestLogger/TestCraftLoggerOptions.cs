namespace TestCraft.VSTestLogger;

internal sealed record TestCraftLoggerOptions(
    string ApiUrl,
    string ProjectId,
    string RunId,
    string? Token
)
{
    public static TestCraftLoggerOptions? Resolve(HttpClient http)
    {
        var apiUrl = Environment.GetEnvironmentVariable("TESTCRAFT_API_URL");
        var runId = Environment.GetEnvironmentVariable("TESTCRAFT_RUN_ID");
        if (string.IsNullOrEmpty(apiUrl) || string.IsNullOrEmpty(runId))
            return null;

        var token = Environment.GetEnvironmentVariable("TESTCRAFT_TOKEN");
        var projectId = Environment.GetEnvironmentVariable("TESTCRAFT_PROJECT_ID");
        if (!string.IsNullOrEmpty(token) && !string.IsNullOrEmpty(projectId))
            return new TestCraftLoggerOptions(apiUrl, projectId, runId, token);

        return ResolveFromCredentials(http, apiUrl, runId);
    }

    private static TestCraftLoggerOptions? ResolveFromCredentials(
        HttpClient http,
        string apiUrl,
        string runId
    )
    {
        var username = Environment.GetEnvironmentVariable("TESTCRAFT_USERNAME");
        var password = Environment.GetEnvironmentVariable("TESTCRAFT_PASSWORD");
        var projectName = Environment.GetEnvironmentVariable(
            "TESTCRAFT_PROJECT_NAME"
        );

        if (
            string.IsNullOrEmpty(username)
            || string.IsNullOrEmpty(password)
            || string.IsNullOrEmpty(projectName)
        )
            return null;

        try
        {
            var authority =
                Environment.GetEnvironmentVariable("TESTCRAFT_KEYCLOAK_AUTHORITY")
                ?? TestCraftApiClient.FetchAuthority(http, apiUrl);
            var token = TestCraftApiClient.FetchToken(
                http,
                authority,
                username,
                password
            );
            var projectId = TestCraftApiClient.FindProjectId(
                http,
                apiUrl,
                token,
                projectName
            );

            return new TestCraftLoggerOptions(apiUrl, projectId, runId, token);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(
                $"[TestCraft] Logger init failed: {ex.Message}"
            );
            return null;
        }
    }

    public override string ToString() =>
        $"{{ ApiUrl = {ApiUrl}, ProjectId = {ProjectId}, RunId = {RunId}, Token = <redacted> }}";
}
