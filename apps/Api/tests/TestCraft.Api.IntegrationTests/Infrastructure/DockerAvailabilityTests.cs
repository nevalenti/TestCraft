using Docker.DotNet;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

public class DockerAvailabilityTests
{
    [Fact]
    public async Task Docker_ShouldBeRunning_ForIntegrationTestCoverage()
    {
        try
        {
            using var client = new DockerClientBuilder().Build();
            await client.System.PingAsync();
        }
        catch (Exception)
        {
            Assert.Fail(
                "Docker is not running or is misconfigured. Integration tests spin up a "
                    + "Postgres container via Testcontainers and will fail or hang without it. "
                    + "Please start Docker and re-run the tests."
            );
        }
    }
}
