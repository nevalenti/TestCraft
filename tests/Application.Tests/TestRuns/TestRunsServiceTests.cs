using Application.Projects;
using Application.TestRuns;

using AwesomeAssertions;

using Domain.Entities;

using Moq;

using Xunit;

namespace Application.Tests.TestRuns;

public class TestRunsServiceTests
{
    private readonly Mock<IProjectRepository> _projects = new();
    private readonly Mock<ITestRunRepository> _runs = new();
    private readonly TestRunsService _service;

    public TestRunsServiceTests()
    {
        _service = new TestRunsService(_projects.Object, _runs.Object);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsRepositoryResult()
    {
        var projectId = Guid.NewGuid();
        var expected = new List<TestRunDto> { new(Guid.NewGuid(), projectId, "Run 1", "Staging", null, DateTime.UtcNow, null) };
        _runs.Setup(r => r.GetAllAsync(projectId, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.GetAllAsync(projectId);

        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var expected = new TestRunDto(id, projectId, "Run 1", "Staging", null, DateTime.UtcNow, null);
        _runs.Setup(r => r.GetByIdAsync(projectId, id, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.GetByIdAsync(projectId, id);

        result.Should().Be(expected);
    }

    [Fact]
    public async Task CreateAsync_WhenProjectNotFound_ReturnsNullAndDoesNotAddRun()
    {
        _projects.Setup(r => r.ExistsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await _service.CreateAsync(Guid.NewGuid(), new CreateTestRunDto("Run", "Staging"));

        result.Should().BeNull();
        _runs.Verify(r => r.AddAsync(It.IsAny<TestRun>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WhenProjectFound_AddsWithCorrectProperties()
    {
        var projectId = Guid.NewGuid();
        var dto = new CreateTestRunDto("Smoke Test", "Production");
        var expected = new TestRunDto(Guid.NewGuid(), projectId, "Smoke Test", "Production", null, DateTime.UtcNow, null);
        _projects.Setup(r => r.ExistsAsync(projectId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _runs.Setup(r => r.AddAsync(It.IsAny<TestRun>(), It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.CreateAsync(projectId, dto);

        result.Should().Be(expected);
        _runs.Verify(r => r.AddAsync(
            It.Is<TestRun>(run => run.Name == dto.Name && run.Environment == dto.Environment && run.ProjectId == projectId),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_AppliesCorrectMutation()
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var dto = new UpdateTestRunDto("Updated Run", "QA");
        Action<TestRun>? captured = null;
        _runs.Setup(r => r.UpdateAsync(projectId, id, It.IsAny<Action<TestRun>>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, Guid, Action<TestRun>, CancellationToken>((_, _, mutate, _) => captured = mutate)
            .ReturnsAsync(true);

        var result = await _service.UpdateAsync(projectId, id, dto);

        result.Should().BeTrue();
        var run = new TestRun { Name = "Old", Environment = "Old" };
        captured!(run);
        run.Name.Should().Be("Updated Run");
        run.Environment.Should().Be("QA");
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepository()
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _runs.Setup(r => r.DeleteAsync(projectId, id, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _service.DeleteAsync(projectId, id);

        result.Should().BeTrue();
    }
}