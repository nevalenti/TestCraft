using Api.Controllers;

using Application.TestRuns;

using AwesomeAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

using Xunit;

namespace Api.Tests.TestRuns;

public class TestRunsControllerTests
{
    private readonly Mock<ITestRunsService> _service = new();
    private readonly TestRunsController _controller;

    public TestRunsControllerTests()
    {
        _controller = new TestRunsController(_service.Object);
    }

    [Fact]
    public async Task GetRuns_ReturnsOkWithAllRuns()
    {
        var projectId = Guid.NewGuid();
        var runs = new List<TestRunDto>
        {
            new(Guid.NewGuid(), projectId, "Run 1", "Staging", null, DateTime.UtcNow, null),
            new(Guid.NewGuid(), projectId, "Run 2", "Production", null, DateTime.UtcNow, null)
        };
        _service.Setup(s => s.GetAllAsync(projectId, It.IsAny<CancellationToken>())).ReturnsAsync(runs);

        var result = await _controller.GetRuns(projectId, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(runs);
    }

    [Fact]
    public async Task GetRuns_WhenEmpty_ReturnsOkWithEmptyList()
    {
        var projectId = Guid.NewGuid();
        _service.Setup(s => s.GetAllAsync(projectId, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var result = await _controller.GetRuns(projectId, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(Array.Empty<TestRunDto>());
    }

    [Fact]
    public async Task GetRun_WhenFound_ReturnsOkWithRun()
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var run = new TestRunDto(id, projectId, "Run 1", "Staging", null, DateTime.UtcNow, null);
        _service.Setup(s => s.GetByIdAsync(projectId, id, It.IsAny<CancellationToken>())).ReturnsAsync(run);

        var result = await _controller.GetRun(projectId, id, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(run);
    }

    [Fact]
    public async Task GetRun_WhenNotFound_ReturnsNotFound()
    {
        var projectId = Guid.NewGuid();
        _service.Setup(s => s.GetByIdAsync(projectId, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(default(TestRunDto));

        var result = await _controller.GetRun(projectId, Guid.NewGuid(), CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateRun_ReturnsCreatedAtActionWithRun()
    {
        var projectId = Guid.NewGuid();
        var request = new CreateTestRunDto("Run 1", "Staging");
        var created = new TestRunDto(Guid.NewGuid(), projectId, "Run 1", "Staging", null, DateTime.UtcNow, null);
        _service.Setup(s => s.CreateAsync(projectId, request, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await _controller.CreateRun(projectId, request, CancellationToken.None);

        var createdAt = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdAt.ActionName.Should().Be(nameof(TestRunsController.GetRun));
        createdAt.RouteValues!["id"].Should().Be(created.Id);
        createdAt.Value.Should().Be(created);
        _service.Verify(s => s.CreateAsync(projectId, request, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateRun_WhenProjectNotFound_ReturnsNotFound()
    {
        var projectId = Guid.NewGuid();
        _service.Setup(s => s.CreateAsync(projectId, It.IsAny<CreateTestRunDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(default(TestRunDto));

        var result = await _controller.CreateRun(projectId, new CreateTestRunDto("Run 1", "Staging"), CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Theory]
    [InlineData(true, typeof(NoContentResult))]
    [InlineData(false, typeof(NotFoundResult))]
    public async Task UpdateRun_ReturnsCorrectResult(bool exists, Type expected)
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _service.Setup(s => s.UpdateAsync(projectId, id, It.IsAny<UpdateTestRunDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(exists);

        var result = await _controller.UpdateRun(projectId, id, new UpdateTestRunDto("Updated", "Production"), CancellationToken.None);

        result.Should().BeOfType(expected);
        _service.Verify(s => s.UpdateAsync(projectId, id, It.IsAny<UpdateTestRunDto>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(true, typeof(NoContentResult))]
    [InlineData(false, typeof(NotFoundResult))]
    public async Task DeleteRun_ReturnsCorrectResult(bool exists, Type expected)
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _service.Setup(s => s.DeleteAsync(projectId, id, It.IsAny<CancellationToken>())).ReturnsAsync(exists);

        var result = await _controller.DeleteRun(projectId, id, CancellationToken.None);

        result.Should().BeOfType(expected);
        _service.Verify(s => s.DeleteAsync(projectId, id, It.IsAny<CancellationToken>()), Times.Once);
    }
}