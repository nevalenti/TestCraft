using Api.Controllers;

using Application.Projects;

using AwesomeAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

using Xunit;

namespace Api.Tests.Projects;

public class ProjectsControllerTests
{
    private readonly Mock<IProjectsService> _service = new();
    private readonly ProjectsController _controller;

    public ProjectsControllerTests()
    {
        _controller = new ProjectsController(_service.Object);
    }

    [Fact]
    public async Task GetProjects_ReturnsOkWithAllProjects()
    {
        var projects = new List<ProjectDto>
        {
            new(Guid.NewGuid(), "Alpha", null, DateTime.UtcNow, null),
            new(Guid.NewGuid(), "Beta", "desc", DateTime.UtcNow, null)
        };
        _service.Setup(s => s.GetAllAsync(It.IsAny<string?>(), It.IsAny<CancellationToken>())).ReturnsAsync(projects);

        var result = await _controller.GetProjects(null, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(projects);
    }

    [Fact]
    public async Task GetProjects_WhenEmpty_ReturnsOkWithEmptyList()
    {
        _service.Setup(s => s.GetAllAsync(It.IsAny<string?>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var result = await _controller.GetProjects(null, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(Array.Empty<ProjectDto>());
    }

    [Fact]
    public async Task GetProject_WhenFound_ReturnsOkWithProject()
    {
        var id = Guid.NewGuid();
        var project = new ProjectDto(id, "Alpha", null, DateTime.UtcNow, null);
        _service.Setup(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(project);

        var result = await _controller.GetProject(id, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(project);
    }

    [Fact]
    public async Task GetProject_WhenNotFound_ReturnsNotFound()
    {
        _service.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ProjectDto?)null);

        var result = await _controller.GetProject(Guid.NewGuid(), CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateProject_ReturnsCreatedAtActionWithProject()
    {
        var request = new CreateProjectDto("Alpha", null);
        var created = new ProjectDto(Guid.NewGuid(), "Alpha", null, DateTime.UtcNow, null);
        _service.Setup(s => s.CreateAsync(request, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await _controller.CreateProject(request, CancellationToken.None);

        var createdAt = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdAt.ActionName.Should().Be(nameof(ProjectsController.GetProject));
        createdAt.RouteValues!["id"].Should().Be(created.Id);
        createdAt.Value.Should().Be(created);
        _service.Verify(s => s.CreateAsync(request, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(true, typeof(NoContentResult))]
    [InlineData(false, typeof(NotFoundResult))]
    public async Task UpdateProject_ReturnsCorrectResult(bool exists, Type expected)
    {
        var id = Guid.NewGuid();
        _service.Setup(s => s.UpdateAsync(id, It.IsAny<UpdateProjectDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(exists);

        var result = await _controller.UpdateProject(id, new UpdateProjectDto("Updated", null), CancellationToken.None);

        result.Should().BeOfType(expected);
    }

    [Theory]
    [InlineData(true, typeof(NoContentResult))]
    [InlineData(false, typeof(NotFoundResult))]
    public async Task DeleteProject_ReturnsCorrectResult(bool exists, Type expected)
    {
        var id = Guid.NewGuid();
        _service.Setup(s => s.DeleteAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(exists);

        var result = await _controller.DeleteProject(id, CancellationToken.None);

        result.Should().BeOfType(expected);
    }
}