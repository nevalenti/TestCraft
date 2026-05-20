using Application.Projects;
using Application.TestSuites;

using AwesomeAssertions;

using Domain.Entities;

using Moq;

using Xunit;

namespace Application.Tests.TestSuites;

public class TestSuitesServiceTests
{
    private readonly Mock<IProjectRepository> _projects = new();
    private readonly Mock<ITestSuiteRepository> _suites = new();
    private readonly TestSuitesService _service;

    public TestSuitesServiceTests()
    {
        _service = new TestSuitesService(_projects.Object, _suites.Object);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsRepositoryResult()
    {
        var projectId = Guid.NewGuid();
        var expected = new List<TestSuiteDto> { new(Guid.NewGuid(), projectId, "Suite A", null, DateTime.UtcNow, null) };
        _suites.Setup(r => r.GetAllAsync(projectId, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.GetAllAsync(projectId);

        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var expected = new TestSuiteDto(id, projectId, "Suite A", null, DateTime.UtcNow, null);
        _suites.Setup(r => r.GetByIdAsync(projectId, id, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.GetByIdAsync(projectId, id);

        result.Should().Be(expected);
    }

    [Fact]
    public async Task CreateAsync_WhenProjectNotFound_ReturnsNullAndDoesNotAddSuite()
    {
        _projects.Setup(r => r.ExistsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await _service.CreateAsync(Guid.NewGuid(), new CreateTestSuiteDto("Suite", null));

        result.Should().BeNull();
        _suites.Verify(r => r.AddAsync(It.IsAny<TestSuite>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WhenProjectFound_AddsWithCorrectProperties()
    {
        var projectId = Guid.NewGuid();
        var dto = new CreateTestSuiteDto("Suite A", "desc");
        var expected = new TestSuiteDto(Guid.NewGuid(), projectId, "Suite A", "desc", DateTime.UtcNow, null);
        _projects.Setup(r => r.ExistsAsync(projectId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _suites.Setup(r => r.AddAsync(It.IsAny<TestSuite>(), It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.CreateAsync(projectId, dto);

        result.Should().Be(expected);
        _suites.Verify(r => r.AddAsync(
            It.Is<TestSuite>(s => s.Name == dto.Name && s.Description == dto.Description && s.ProjectId == projectId),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_AppliesCorrectMutation()
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var dto = new UpdateTestSuiteDto("Updated", "New desc");
        Action<TestSuite>? captured = null;
        _suites.Setup(r => r.UpdateAsync(projectId, id, It.IsAny<Action<TestSuite>>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, Guid, Action<TestSuite>, CancellationToken>((_, _, mutate, _) => captured = mutate)
            .ReturnsAsync(true);

        var result = await _service.UpdateAsync(projectId, id, dto);

        result.Should().BeTrue();
        var suite = new TestSuite { Name = "Old", Description = "Old" };
        captured!(suite);
        suite.Name.Should().Be("Updated");
        suite.Description.Should().Be("New desc");
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepository()
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _suites.Setup(r => r.DeleteAsync(projectId, id, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _service.DeleteAsync(projectId, id);

        result.Should().BeTrue();
    }
}