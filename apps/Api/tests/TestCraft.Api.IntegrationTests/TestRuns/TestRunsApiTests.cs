using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestResults;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Enums;
using TestCraft.Persistence;

namespace TestCraft.Api.IntegrationTests.TestRuns;

[Collection(ApiCollection.Name)]
public class TestRunsApiTests(ApiFactory factory)
{
    private HttpClient CreateClient(Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            userId.ToString()
        );

        return client;
    }

    [Fact]
    public async Task Create_Then_GetById_ReturnsRunWithDefaultActiveStatus()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs",
            new CreateTestRun.Command { Name = "Smoke Run", Environment = "staging" }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        createResponse.Headers.ETag!.Tag.Should().Be("\"1\"");

        var created = await createResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Status.Should().Be(TestRunStatus.Active);
        created.ProjectId.Should().Be(project.Id);

        var getResponse = await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        fetched!.Id.Should().Be(created.Id);
    }

    [Fact]
    public async Task Create_WithIdempotencyKey_ReplaysOriginalRun()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var path = $"/api/v1/projects/{project.Id}/runs";

        async Task<HttpResponseMessage> SendAsync(string name)
        {
            using var request = CreateRunRequest(path, name, "create-run-1");
            return await client.SendAsync(request);
        }

        using var first = await SendAsync("Smoke Run");
        using var replay = await SendAsync("Smoke Run");

        first.StatusCode.Should().Be(HttpStatusCode.Created);
        replay.StatusCode.Should().Be(HttpStatusCode.Created);
        (await replay.Content.ReadAsStringAsync())
            .Should()
            .Be(await first.Content.ReadAsStringAsync());
        replay.Headers.Location.Should().Be(first.Headers.Location);

        using var changed = await SendAsync("Different Run");
        changed.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var problem = await changed.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("code").GetString().Should().Be("IDEMPOTENCY_KEY_REUSED");

        using var scope = factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await context.TestRuns.CountAsync(run => run.ProjectId == project.Id)).Should().Be(1);
    }

    [Fact]
    public async Task Create_WithIdempotencyKey_OtherUserCannotReplayResponse()
    {
        var owner = CreateClient(Guid.NewGuid());
        var otherUser = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var path = $"/api/v1/projects/{project.Id}/runs";

        using var firstRequest = CreateRunRequest(path, "Private Run", "private-run-1");
        using var first = await owner.SendAsync(firstRequest);
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        using var replayRequest = CreateRunRequest(path, "Private Run", "private-run-1");
        using var replay = await otherUser.SendAsync(replayRequest);
        replay.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_FailedRequest_ReleasesItsIdempotencyKey()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var path = $"/api/v1/projects/{project.Id}/runs";

        using var invalid = await client.SendAsync(CreateRunRequest(path, "", "retry-after-fix"));
        using var valid = await client.SendAsync(
            CreateRunRequest(path, "Fixed", "retry-after-fix")
        );

        invalid.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        valid.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Theory]
    [InlineData(1, HttpStatusCode.Conflict)]
    [InlineData(10, HttpStatusCode.Created)]
    public async Task Create_WithAReservedKey_WaitsUntilTheReservationIsAbandoned(
        int reservedMinutesAgo,
        HttpStatusCode expected
    )
    {
        var userId = Guid.NewGuid();
        var client = CreateClient(userId);
        var project = await client.CreateProjectAsync();
        using (var scope = factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            context.IdempotencyRecords.Add(
                new IdempotencyRecord
                {
                    Principal = $"user:{userId}",
                    Key = "reserved",
                    RequestHash = "other",
                    CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-reservedMinutesAgo),
                }
            );
            await context.SaveChangesAsync();
        }

        using var response = await client.SendAsync(
            CreateRunRequest($"/api/v1/projects/{project.Id}/runs", "Run", "reserved")
        );

        response.StatusCode.Should().Be(expected);
        if (expected == HttpStatusCode.Conflict)
        {
            response.Headers.RetryAfter!.Delta.Should().Be(TimeSpan.FromSeconds(1));
        }
    }

    [Fact]
    public async Task Create_AfterLosingItsReservation_LeavesTheNewReservationAlone()
    {
        const string key = "taken-over";
        await using var takeoverFactory = factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.ConfigureDbContext<AppDbContext>(options =>
                    options.AddInterceptors(new IdempotencyTakeoverInterceptor(key))
                )
            )
        );
        var userId = Guid.NewGuid();
        var client = takeoverFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            userId.ToString()
        );
        var project = await client.CreateProjectAsync();

        using var response = await client.SendAsync(
            CreateRunRequest($"/api/v1/projects/{project.Id}/runs", "Run", key)
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        using var scope = factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var record = await context.IdempotencyRecords.SingleAsync(record =>
            record.Principal == $"user:{userId}" && record.Key == key
        );
        record.RequestHash.Should().Be("takeover");
        record.StatusCode.Should().BeNull();
    }

    private static HttpRequestMessage CreateRunRequest(string path, string name, string key)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = WireJson.Content(
                new CreateTestRun.Command { Name = name, Environment = "ci" }
            ),
        };
        request.Headers.Add("Idempotency-Key", key);

        return request;
    }

    [Fact]
    public async Task GetAll_FiltersBySearch()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        await client.CreateRunAsync(project.Id, "Smoke Run");
        await client.CreateRunAsync(project.Id, "Regression Run");

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/runs?search=Smoke");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await response.Content.ReadFromJsonAsync<Paginated<TestRunResponse>>(
            ApiTestHelpers.JsonOptions
        );
        page!.Items.Should().ContainSingle(run => run.Name == "Smoke Run");
        page.Items.Should().NotContain(run => run.Name == "Regression Run");
    }

    [Fact]
    public async Task Update_ValidStatusTransition_Succeeds()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var updateResponse = await client.UpdateAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRun.Command
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Completed,
            }
        );

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        updated!.Status.Should().Be(TestRunStatus.Completed);
    }

    [Fact]
    public async Task Update_StatusTransition_PreservesCreatedAtButAdvancesUpdatedAt()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        run.CreatedAt.Should().Be(run.UpdatedAt);

        await Task.Delay(TimeSpan.FromMilliseconds(50));

        var updateResponse = await client.UpdateAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRun.Command
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Completed,
            }
        );

        var updated = await updateResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );

        updated!.CreatedAt.Should().BeCloseTo(run.CreatedAt, TimeSpan.FromMilliseconds(1));
        updated.UpdatedAt.Should().BeAfter(run.UpdatedAt);
    }

    [Fact]
    public async Task Update_BackwardStatusTransition_ReturnsUnprocessable()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        await client.UpdateAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRun.Command
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Completed,
            }
        );

        var response = await client.UpdateAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRun.Command
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Active,
            },
            version: 2
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Update_NonExistentRun_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var runId = TestRunId.New();

        var response = await client.UpdateAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{runId}",
            new UpdateTestRun.Command
            {
                Id = runId,
                Name = "Doesn't matter",
                Environment = "ci",
                Status = TestRunStatus.Active,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Delete_RemovesRun()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id, "To Delete");

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetSummary_NoResults_ReturnsZeroedTotals()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/summary"
        );
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var summary = await response.Content.ReadFromJsonAsync<GetTestRunSummary.Response>(
            ApiTestHelpers.JsonOptions
        );
        summary!.Total.Should().Be(0);
        summary.Passed.Should().Be(0);
        summary.Failed.Should().Be(0);
        summary.Blocked.Should().Be(0);
        summary.Skipped.Should().Be(0);
        summary.PassRate.Should().Be(0);
    }

    [Fact]
    public async Task GetSummary_WithMixedResults_ComputesCountsAndPassRate()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var case1 = await client.CreateCaseAsync(project.Id, suite.Id, "Passes");
        var case2 = await client.CreateCaseAsync(project.Id, suite.Id, "Fails");
        var case3 = await client.CreateCaseAsync(project.Id, suite.Id, "Blocked");
        var run = await client.CreateRunAsync(project.Id);

        await client.CreateResultAsync(project.Id, run.Id, case1.Id, TestResultStatus.Passed);
        await client.CreateResultAsync(project.Id, run.Id, case2.Id, TestResultStatus.Failed);
        await client.CreateResultAsync(project.Id, run.Id, case3.Id, TestResultStatus.Blocked);

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/summary"
        );
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var summary = await response.Content.ReadFromJsonAsync<GetTestRunSummary.Response>(
            ApiTestHelpers.JsonOptions
        );
        summary!.Total.Should().Be(3);
        summary.Passed.Should().Be(1);
        summary.Failed.Should().Be(1);
        summary.Blocked.Should().Be(1);
        summary.PassRate.Should().Be(33.3);
    }

    [Fact]
    public async Task GetSummary_RepeatedCase_UsesNewestExecution()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var run = await client.CreateRunAsync(project.Id);
        var path = $"/api/v1/projects/{project.Id}/runs/{run.Id}/results";
        var now = DateTimeOffset.UtcNow;

        foreach (
            var (status, executedAt) in new[]
            {
                (TestResultStatus.Passed, now.AddMinutes(-10)),
                (TestResultStatus.Failed, now),
                (TestResultStatus.Passed, now.AddMinutes(-5)),
            }
        )
        {
            (
                await client.PostAsJsonAsync(
                    path,
                    new CreateTestResult.Command
                    {
                        TestCaseId = testCase.Id,
                        Status = status,
                        ExecutedAt = executedAt,
                    }
                )
            ).StatusCode.Should().Be(HttpStatusCode.Created);
        }

        var summary = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}/summary")
        ).Content.ReadFromJsonAsync<GetTestRunSummary.Response>(ApiTestHelpers.JsonOptions);

        summary!.Total.Should().Be(1);
        summary.Failed.Should().Be(1);
        summary.Passed.Should().Be(0);
        summary.PassRate.Should().Be(0);
    }

    [Fact]
    public async Task GetById_OtherUsersProject_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        var project = await ownerClient.CreateProjectAsync();
        var run = await ownerClient.CreateRunAsync(project.Id, "Private Run");

        var response = await otherClient.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Create_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{Guid.NewGuid()}/runs",
            new CreateTestRun.Command { Name = "Nope", Environment = "ci" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithInvalidBody_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs",
            new CreateTestRun.Command { Name = "", Environment = "" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Update_ConcurrentLoads_RejectsLostUpdate()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        using var scopeA = factory.Services.CreateScope();
        using var scopeB = factory.Services.CreateScope();
        var contextA = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();
        var contextB = scopeB.ServiceProvider.GetRequiredService<AppDbContext>();

        var runA = await contextA.TestRuns.SingleAsync(testRun => testRun.Id == run.Id);
        var runB = await contextB.TestRuns.SingleAsync(testRun => testRun.Id == run.Id);

        runB.TransitionTo(TestRunStatus.Archived);
        await contextB.SaveChangesAsync();

        var act = () =>
        {
            runA.TransitionTo(TestRunStatus.Completed);
            return contextA.SaveChangesAsync();
        };

        await act.Should().ThrowAsync<DbUpdateConcurrencyException>();

        var final = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}")
        ).Content.ReadFromJsonAsync<TestRunResponse>(ApiTestHelpers.JsonOptions);

        final!.Status.Should().Be(TestRunStatus.Archived);
    }

    [Fact]
    public async Task Update_WithStaleIfMatch_ReturnsPreconditionFailed()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);
        var path = $"/api/v1/projects/{project.Id}/runs/{run.Id}";

        using var read = await client.GetAsync(path);
        read.Headers.ETag!.Tag.Should().Be("\"1\"");

        async Task<HttpResponseMessage> UpdateAsync(string name, string ifMatch)
        {
            using var request = new HttpRequestMessage(HttpMethod.Put, path)
            {
                Content = WireJson.Content(
                    new UpdateTestRun.Command
                    {
                        Name = name,
                        Environment = "ci",
                        Status = TestRunStatus.Active,
                    }
                ),
            };
            request.Headers.TryAddWithoutValidation("If-Match", ifMatch);
            return await client.SendAsync(request);
        }

        using var first = await UpdateAsync("First edit", read.Headers.ETag.Tag);
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        first.Headers.ETag!.Tag.Should().Be("\"2\"");

        using var stale = await UpdateAsync("Stale edit", read.Headers.ETag.Tag);
        stale.StatusCode.Should().Be(HttpStatusCode.PreconditionFailed);
        stale.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        using var invalid = await UpdateAsync("Invalid edit", "not-an-etag");
        invalid.StatusCode.Should().Be(HttpStatusCode.PreconditionFailed);

        var current = await (
            await client.GetAsync(path)
        ).Content.ReadFromJsonAsync<TestRunResponse>(ApiTestHelpers.JsonOptions);
        current!.Name.Should().Be("First edit");
        current.Version.Should().Be(2);
    }

    [Fact]
    public async Task StaleRunCleanup_PreservesRunsWithRecentLogsOrResults()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var idle = await client.CreateRunAsync(project.Id, "Idle");
        var logging = await client.CreateRunAsync(project.Id, "Logging");
        var testing = await client.CreateRunAsync(project.Id, "Testing");

        using var scope = factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var oldTime = DateTimeOffset.UtcNow.AddHours(-3);
        await context
            .TestRuns.Where(run => run.ProjectId == project.Id)
            .ExecuteUpdateAsync(setters =>
                setters
                    .SetProperty(run => run.CreatedAt, oldTime)
                    .SetProperty(run => run.UpdatedAt, oldTime)
            );

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{logging.Id}/logs",
            new AppendRunLogs.Command { Lines = ["Still running"] }
        );
        await client.CreateResultAsync(project.Id, testing.Id, testCase.Id);

        var job = scope.ServiceProvider.GetRequiredService<StaleTestRunCleanupJob>();
        await job.RunAsync(CancellationToken.None);

        (await client.GetRunAsync(project.Id, idle.Id)).Status.Should().Be(TestRunStatus.Completed);
        (await client.GetRunAsync(project.Id, logging.Id)).Status.Should().Be(TestRunStatus.Active);
        (await client.GetRunAsync(project.Id, testing.Id)).Status.Should().Be(TestRunStatus.Active);
    }

    [Fact]
    public async Task AppendLogs_Then_GetLogs_ReturnsLogsInOrder()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var appendResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = ["first line"] }
        );
        appendResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = ["second line"] }
        );

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = ["third line"] }
        );

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs"
        );
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var logs = await getResponse.Content.ReadFromJsonAsync<RunLogPageResponse>(
            ApiTestHelpers.JsonOptions
        );
        logs!
            .Items.Select(line => line.Message)
            .Should()
            .Equal("first line", "second line", "third line");
    }

    [Fact]
    public async Task GetLogs_PagesBackwardsBySeq()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);
        var path = $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs";

        (
            await client.PostAsJsonAsync(
                path,
                new AppendRunLogs.Command { Lines = ["one", "two", "three", "four"] }
            )
        )
            .StatusCode.Should()
            .Be(HttpStatusCode.NoContent);

        var first = await (
            await client.GetAsync($"{path}?limit=2")
        ).Content.ReadFromJsonAsync<RunLogPageResponse>(ApiTestHelpers.JsonOptions);
        var second = await (
            await client.GetAsync($"{path}?limit=2&before_seq={first!.Items[0].Seq}")
        ).Content.ReadFromJsonAsync<RunLogPageResponse>(ApiTestHelpers.JsonOptions);

        first.Items.Select(line => line.Message).Should().Equal("three", "four");
        first.HasMore.Should().BeTrue();
        second!.Items.Select(line => line.Message).Should().Equal("one", "two");
        second.HasMore.Should().BeFalse();
        (await client.GetAsync($"{path}?limit=0"))
            .StatusCode.Should()
            .Be(HttpStatusCode.UnprocessableEntity);
        (await client.GetAsync($"{path}?limit=5001"))
            .StatusCode.Should()
            .Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task AppendLogs_OnArchivedRun_ReturnsUnprocessableAndDoesNotPersist()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);
        var runPath = $"/api/v1/projects/{project.Id}/runs/{run.Id}";

        var archiveResponse = await client.UpdateAsJsonAsync(
            runPath,
            new UpdateTestRun.Command
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Archived,
            }
        );
        archiveResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var appendResponse = await client.PostAsJsonAsync(
            $"{runPath}/logs",
            new AppendRunLogs.Command { Lines = ["too late"] }
        );
        appendResponse.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);

        var logs = await (
            await client.GetAsync($"{runPath}/logs")
        ).Content.ReadFromJsonAsync<RunLogPageResponse>(ApiTestHelpers.JsonOptions);
        logs!.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task AppendLogs_WithIdempotencyKey_DoesNotDuplicateLines()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);
        var path = $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs";

        for (var attempt = 0; attempt < 2; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, path)
            {
                Content = WireJson.Content(new AppendRunLogs.Command { Lines = ["one line"] }),
            };
            request.Headers.Add("Idempotency-Key", "append-logs-1");
            using var response = await client.SendAsync(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        using var getResponse = await client.GetAsync(path);
        var logs = await getResponse.Content.ReadFromJsonAsync<RunLogPageResponse>(
            ApiTestHelpers.JsonOptions
        );
        logs!.Items.Select(line => line.Message).Should().Equal("one line");
    }

    [Fact]
    public async Task AppendLogs_WithIdempotencyKeyAboveTheDefaultBodyLimit_IsAccepted()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs"
        )
        {
            Content = WireJson.Content(
                new AppendRunLogs.Command
                {
                    Lines = [.. Enumerable.Repeat(new string('x', 10_000), 20)],
                }
            ),
        };
        request.Headers.Add("Idempotency-Key", "append-logs-large");

        using var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task AppendLogs_EmptyLines_IsNoOp()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var appendResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = [] }
        );
        appendResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs"
        );
        var logs = await getResponse.Content.ReadFromJsonAsync<RunLogPageResponse>(
            ApiTestHelpers.JsonOptions
        );
        logs!.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task GetLogs_NewRun_ReturnsEmptyList()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}/logs");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var logs = await response.Content.ReadFromJsonAsync<RunLogPageResponse>(
            ApiTestHelpers.JsonOptions
        );
        logs!.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task GetLogs_NonExistentRun_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{Guid.NewGuid()}/logs"
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task AppendLogs_NonExistentRun_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{Guid.NewGuid()}/logs",
            new AppendRunLogs.Command { Lines = ["line"] }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task AppendLogs_OtherUsersProject_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        var project = await ownerClient.CreateProjectAsync();
        var run = await ownerClient.CreateRunAsync(project.Id);

        var response = await otherClient.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = ["snooping"] }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
