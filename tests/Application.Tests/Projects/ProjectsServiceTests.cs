using Application.Projects;

using AwesomeAssertions;

using Domain.Entities;

using Moq;

using Xunit;

namespace Application.Tests.Projects;

public class ProjectsServiceTests
{
    private readonly Mock<IProjectRepository> _repo = new();
    private readonly ProjectsService _service;

    public ProjectsServiceTests()
    {
        _service = new ProjectsService(_repo.Object);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsRepositoryResult()
    {
        var expected = new List<ProjectDto> { new(Guid.NewGuid(), "Alpha", null, DateTime.UtcNow, null) };
        _repo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.GetAllAsync();

        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        var id = Guid.NewGuid();
        var expected = new ProjectDto(id, "Alpha", null, DateTime.UtcNow, null);
        _repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.GetByIdAsync(id);

        result.Should().Be(expected);
    }

    [Fact]
    public async Task GetByIdAsync_WhenNotFound_ReturnsNull()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((ProjectDto?)null);

        var result = await _service.GetByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_AddsProjectWithCorrectProperties()
    {
        var dto = new CreateProjectDto("Alpha", "desc");
        var expected = new ProjectDto(Guid.NewGuid(), "Alpha", "desc", DateTime.UtcNow, null);
        _repo.Setup(r => r.AddAsync(It.IsAny<Project>(), It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.CreateAsync(dto);

        result.Should().Be(expected);
        _repo.Verify(r => r.AddAsync(
            It.Is<Project>(p => p.Name == "Alpha" && p.Description == "desc"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenFound_AppliesCorrectMutation()
    {
        var id = Guid.NewGuid();
        var dto = new UpdateProjectDto("Updated", "New desc");
        Action<Project>? captured = null;
        _repo.Setup(r => r.UpdateAsync(id, It.IsAny<Action<Project>>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, Action<Project>, CancellationToken>((_, mutate, _) => captured = mutate)
            .ReturnsAsync(true);

        var result = await _service.UpdateAsync(id, dto);

        result.Should().BeTrue();
        var project = new Project { Name = "Old", Description = "Old desc" };
        captured!(project);
        project.Name.Should().Be("Updated");
        project.Description.Should().Be("New desc");
    }

    [Fact]
    public async Task UpdateAsync_WhenNotFound_ReturnsFalse()
    {
        _repo.Setup(r => r.UpdateAsync(It.IsAny<Guid>(), It.IsAny<Action<Project>>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await _service.UpdateAsync(Guid.NewGuid(), new UpdateProjectDto("x", null));

        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_WhenFound_ReturnsTrue()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.DeleteAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _service.DeleteAsync(id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsFalse()
    {
        _repo.Setup(r => r.DeleteAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await _service.DeleteAsync(Guid.NewGuid());

        result.Should().BeFalse();
    }
}