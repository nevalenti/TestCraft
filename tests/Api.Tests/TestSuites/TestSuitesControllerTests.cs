using Api.Controllers;

using Application.TestSuites;

using AwesomeAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

using Xunit;

namespace Api.Tests.TestSuites;

public class TestSuitesControllerTests
{
    private readonly Mock<ITestSuitesService> _service = new();
    private readonly TestSuitesController _controller;

    public TestSuitesControllerTests()
    {
        _controller = new TestSuitesController(_service.Object);
    }

    [Fact]
    public async Task GetSuites_ReturnsOkWithAllSuites()
    {
        var projectId = Guid.NewGuid();
        var suites = new List<TestSuiteDto>
        {
            new(Guid.NewGuid(), projectId, "Suite A", null, DateTime.UtcNow, null),
            new(Guid.NewGuid(), projectId, "Suite B", "desc", DateTime.UtcNow, null)
        };
        _service.Setup(s => s.GetAllAsync(projectId, It.IsAny<CancellationToken>())).ReturnsAsync(suites);

        var result = await _controller.GetSuites(projectId, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(suites);
    }

    [Fact]
    public async Task GetSuites_WhenEmpty_ReturnsOkWithEmptyList()
    {
        var projectId = Guid.NewGuid();
        _service.Setup(s => s.GetAllAsync(projectId, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var result = await _controller.GetSuites(projectId, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(Array.Empty<TestSuiteDto>());
    }

    [Fact]
    public async Task GetSuite_WhenFound_ReturnsOkWithSuite()
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var suite = new TestSuiteDto(id, projectId, "Suite A", null, DateTime.UtcNow, null);
        _service.Setup(s => s.GetByIdAsync(projectId, id, It.IsAny<CancellationToken>())).ReturnsAsync(suite);

        var result = await _controller.GetSuite(projectId, id, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(suite);
    }

    [Fact]
    public async Task GetSuite_WhenNotFound_ReturnsNotFound()
    {
        var projectId = Guid.NewGuid();
        _service.Setup(s => s.GetByIdAsync(projectId, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(default(TestSuiteDto));

        var result = await _controller.GetSuite(projectId, Guid.NewGuid(), CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateSuite_ReturnsCreatedAtActionWithSuite()
    {
        var projectId = Guid.NewGuid();
        var request = new CreateTestSuiteDto("Suite A", null);
        var created = new TestSuiteDto(Guid.NewGuid(), projectId, "Suite A", null, DateTime.UtcNow, null);
        _service.Setup(s => s.CreateAsync(projectId, request, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await _controller.CreateSuite(projectId, request, CancellationToken.None);

        var createdAt = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdAt.ActionName.Should().Be(nameof(TestSuitesController.GetSuite));
        createdAt.RouteValues!["id"].Should().Be(created.Id);
        createdAt.Value.Should().Be(created);
        _service.Verify(s => s.CreateAsync(projectId, request, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateSuite_WhenProjectNotFound_ReturnsNotFound()
    {
        var projectId = Guid.NewGuid();
        _service.Setup(s => s.CreateAsync(projectId, It.IsAny<CreateTestSuiteDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(default(TestSuiteDto));

        var result = await _controller.CreateSuite(projectId, new CreateTestSuiteDto("Suite A", null), CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Theory]
    [InlineData(true, typeof(NoContentResult))]
    [InlineData(false, typeof(NotFoundResult))]
    public async Task UpdateSuite_ReturnsCorrectResult(bool exists, Type expected)
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _service.Setup(s => s.UpdateAsync(projectId, id, It.IsAny<UpdateTestSuiteDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(exists);

        var result = await _controller.UpdateSuite(projectId, id, new UpdateTestSuiteDto("Updated", null), CancellationToken.None);

        result.Should().BeOfType(expected);
        _service.Verify(s => s.UpdateAsync(projectId, id, It.IsAny<UpdateTestSuiteDto>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(true, typeof(NoContentResult))]
    [InlineData(false, typeof(NotFoundResult))]
    public async Task DeleteSuite_ReturnsCorrectResult(bool exists, Type expected)
    {
        var projectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _service.Setup(s => s.DeleteAsync(projectId, id, It.IsAny<CancellationToken>())).ReturnsAsync(exists);

        var result = await _controller.DeleteSuite(projectId, id, CancellationToken.None);

        result.Should().BeOfType(expected);
        _service.Verify(s => s.DeleteAsync(projectId, id, It.IsAny<CancellationToken>()), Times.Once);
    }
}