using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.Dashboard;
using TestCraft.Domain.Enums;
using TestCraft.Persistence;

namespace TestCraft.Api.IntegrationTests.Dashboard;

[Collection(ApiCollection.Name)]
public class DashboardApiTests(ApiFactory factory)
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
    public async Task GetSummary_WithoutRuns_HasNoPassRate()
    {
        var client = CreateClient(Guid.NewGuid());
        var response = await client.GetAsync("/api/v1/dashboard/summary");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var summary = await response.Content.ReadFromJsonAsync<DashboardSummaryResponse>(
            ApiTestHelpers.JsonOptions
        );
        summary!.WindowDays.Should().Be(7);
        summary.PassRate.Should().BeNull();
        summary.PreviousPassRate.Should().BeNull();
        summary.ExecutedCount.Should().Be(0);
        summary.ActiveRunCount.Should().Be(0);
        summary.TopFailingTests.Should().BeEmpty();
    }

    [Fact]
    public async Task GetSummary_CountsVisibleProjectsAndCurrentOutcomes()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var otherProject = await other.CreateProjectAsync();
        var suite = await owner.CreateSuiteAsync(project.Id);
        var testCase = await owner.CreateCaseAsync(project.Id, suite.Id, "Flaky login");
        var runA = await owner.CreateRunAsync(project.Id);
        var runB = await owner.CreateRunAsync(project.Id);
        var runC = await owner.CreateRunAsync(project.Id);
        var otherRun = await other.CreateRunAsync(otherProject.Id);
        var otherSuite = await other.CreateSuiteAsync(otherProject.Id);
        var otherCase = await other.CreateCaseAsync(otherProject.Id, otherSuite.Id);

        await owner.CreateResultAsync(project.Id, runA.Id, testCase.Id, TestResultStatus.Passed);
        await owner.CreateResultAsync(project.Id, runA.Id, testCase.Id, TestResultStatus.Failed);
        await owner.CreateResultAsync(project.Id, runB.Id, testCase.Id, TestResultStatus.Passed);
        await owner.CreateResultAsync(project.Id, runC.Id, testCase.Id, TestResultStatus.Failed);
        await other.CreateResultAsync(
            otherProject.Id,
            otherRun.Id,
            otherCase.Id,
            TestResultStatus.Passed
        );

        var response = await owner.GetAsync("/api/v1/dashboard/summary");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var summary = await response.Content.ReadFromJsonAsync<DashboardSummaryResponse>(
            ApiTestHelpers.JsonOptions
        );

        summary!.ExecutedCount.Should().Be(3);
        summary.PassRate.Should().Be(33.3);
        summary.FailingTestCount.Should().Be(1);
        summary.FlakyTestCount.Should().Be(1);
        summary.ActiveRunCount.Should().Be(3);
        summary
            .TopFailingTests.Should()
            .ContainSingle(test => test.TestCaseId == testCase.Id && test.FailureCount == 2);
    }

    [Fact]
    public async Task GetSummary_IncludesProjectsSharedWithTheUser()
    {
        var owner = CreateClient(Guid.NewGuid());
        var memberId = Guid.NewGuid();
        var directory = (FakeKeycloakUserDirectory)
            factory.Services.GetRequiredService<IKeycloakUserDirectory>();
        directory.Register("dashboard-member@example.com", memberId);
        var project = await owner.CreateProjectAsync();
        await owner.AddMemberAsync(project.Id, "dashboard-member@example.com");
        await owner.CreateRunAsync(project.Id);

        var member = CreateClient(memberId);
        var summary = await (
            await member.GetAsync("/api/v1/dashboard/summary")
        ).Content.ReadFromJsonAsync<DashboardSummaryResponse>(ApiTestHelpers.JsonOptions);

        summary!.ActiveRunCount.Should().Be(1);
    }

    [Fact]
    public async Task GetSummary_LatestPassClearsFailingCaseCount()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var firstRun = await client.CreateRunAsync(project.Id);
        var secondRun = await client.CreateRunAsync(project.Id);
        await client.CreateResultAsync(
            project.Id,
            firstRun.Id,
            testCase.Id,
            TestResultStatus.Failed
        );
        await client.CreateResultAsync(
            project.Id,
            secondRun.Id,
            testCase.Id,
            TestResultStatus.Passed
        );

        var summary = await (
            await client.GetAsync("/api/v1/dashboard/summary")
        ).Content.ReadFromJsonAsync<DashboardSummaryResponse>(ApiTestHelpers.JsonOptions);

        summary!.FailingTestCount.Should().Be(0);
        summary.TopFailingTests.Should().ContainSingle(test => test.FailureCount == 1);
    }

    [Fact]
    public async Task GetSummary_FlakyCountUsesTwentyMostRecentRunsPerProject()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);

        for (var index = 0; index < 21; index++)
        {
            var run = await client.CreateRunAsync(project.Id);
            await client.CreateResultAsync(
                project.Id,
                run.Id,
                testCase.Id,
                index == 0 ? TestResultStatus.Failed : TestResultStatus.Passed
            );
        }

        var summary = await (
            await client.GetAsync("/api/v1/dashboard/summary")
        ).Content.ReadFromJsonAsync<DashboardSummaryResponse>(ApiTestHelpers.JsonOptions);

        summary!.FlakyTestCount.Should().Be(0);
        summary.ExecutedCount.Should().Be(21);
    }

    [Fact]
    public async Task GetSummary_SeparatesCurrentAndPreviousWindows()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var previousRun = await client.CreateRunAsync(project.Id);
        var currentRun = await client.CreateRunAsync(project.Id);
        await client.CreateResultAsync(
            project.Id,
            previousRun.Id,
            testCase.Id,
            TestResultStatus.Passed
        );
        await client.CreateResultAsync(
            project.Id,
            currentRun.Id,
            testCase.Id,
            TestResultStatus.Failed
        );

        using (var scope = factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var run = await context.TestRuns.SingleAsync(item => item.Id == previousRun.Id);
            context.Entry(run).Property(item => item.CreatedAt).CurrentValue =
                DateTimeOffset.UtcNow.AddDays(-10);
            await context.SaveChangesAsync();
        }

        var summary = await (
            await client.GetAsync("/api/v1/dashboard/summary")
        ).Content.ReadFromJsonAsync<DashboardSummaryResponse>(ApiTestHelpers.JsonOptions);

        summary!.PassRate.Should().Be(0);
        summary.PreviousPassRate.Should().Be(100);
        summary.ExecutedCount.Should().Be(1);
    }
}
