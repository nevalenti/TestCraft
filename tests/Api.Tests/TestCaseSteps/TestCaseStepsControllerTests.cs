using Api.Controllers;

using Application.TestCaseSteps;

using AwesomeAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

using Xunit;

namespace Api.Tests.TestCaseSteps;

public class TestCaseStepsControllerTests
{
    private readonly Mock<ITestCaseStepsService> _service = new();
    private readonly TestCaseStepsController _controller;

    public TestCaseStepsControllerTests()
    {
        _controller = new TestCaseStepsController(_service.Object);
    }

    [Fact]
    public async Task GetSteps_ReturnsOkWithAllSteps()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var steps = new List<TestCaseStepDto>
        {
            new(Guid.NewGuid(), caseId, 1, "Click button", "Page navigates", DateTime.UtcNow, null),
            new(Guid.NewGuid(), caseId, 2, "Fill form", "Form submitted", DateTime.UtcNow, null)
        };
        _service.Setup(s => s.GetAllAsync(projectId, suiteId, caseId, It.IsAny<CancellationToken>())).ReturnsAsync(steps);

        var result = await _controller.GetSteps(projectId, suiteId, caseId, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(steps);
    }

    [Fact]
    public async Task GetSteps_WhenEmpty_ReturnsOkWithEmptyList()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        _service.Setup(s => s.GetAllAsync(projectId, suiteId, caseId, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var result = await _controller.GetSteps(projectId, suiteId, caseId, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(Array.Empty<TestCaseStepDto>());
    }

    [Fact]
    public async Task GetStep_WhenFound_ReturnsOkWithStep()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var step = new TestCaseStepDto(id, caseId, 1, "Click button", "Page navigates", DateTime.UtcNow, null);
        _service.Setup(s => s.GetByIdAsync(projectId, suiteId, caseId, id, It.IsAny<CancellationToken>())).ReturnsAsync(step);

        var result = await _controller.GetStep(projectId, suiteId, caseId, id, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(step);
    }

    [Fact]
    public async Task GetStep_WhenNotFound_ReturnsNotFound()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        _service.Setup(s => s.GetByIdAsync(projectId, suiteId, caseId, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(default(TestCaseStepDto));

        var result = await _controller.GetStep(projectId, suiteId, caseId, Guid.NewGuid(), CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateStep_ReturnsCreatedAtActionWithStep()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var request = new CreateTestCaseStepDto(1, "Click button", "Page navigates");
        var created = new TestCaseStepDto(Guid.NewGuid(), caseId, 1, "Click button", "Page navigates", DateTime.UtcNow, null);
        _service.Setup(s => s.CreateAsync(projectId, suiteId, caseId, request, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await _controller.CreateStep(projectId, suiteId, caseId, request, CancellationToken.None);

        var createdAt = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdAt.ActionName.Should().Be(nameof(TestCaseStepsController.GetStep));
        createdAt.RouteValues!["id"].Should().Be(created.Id);
        createdAt.Value.Should().Be(created);
        _service.Verify(s => s.CreateAsync(projectId, suiteId, caseId, request, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateStep_WhenParentNotFound_ReturnsNotFound()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        _service.Setup(s => s.CreateAsync(projectId, suiteId, caseId, It.IsAny<CreateTestCaseStepDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(default(TestCaseStepDto));

        var result = await _controller.CreateStep(projectId, suiteId, caseId, new CreateTestCaseStepDto(1, "Click button", "Page navigates"), CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Theory]
    [InlineData(true, typeof(NoContentResult))]
    [InlineData(false, typeof(NotFoundResult))]
    public async Task UpdateStep_ReturnsCorrectResult(bool exists, Type expected)
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _service.Setup(s => s.UpdateAsync(projectId, suiteId, caseId, id, It.IsAny<UpdateTestCaseStepDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(exists);

        var result = await _controller.UpdateStep(projectId, suiteId, caseId, id, new UpdateTestCaseStepDto(1, "Updated action", "Updated result"), CancellationToken.None);

        result.Should().BeOfType(expected);
        _service.Verify(s => s.UpdateAsync(projectId, suiteId, caseId, id, It.IsAny<UpdateTestCaseStepDto>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(true, typeof(NoContentResult))]
    [InlineData(false, typeof(NotFoundResult))]
    public async Task DeleteStep_ReturnsCorrectResult(bool exists, Type expected)
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _service.Setup(s => s.DeleteAsync(projectId, suiteId, caseId, id, It.IsAny<CancellationToken>())).ReturnsAsync(exists);

        var result = await _controller.DeleteStep(projectId, suiteId, caseId, id, CancellationToken.None);

        result.Should().BeOfType(expected);
        _service.Verify(s => s.DeleteAsync(projectId, suiteId, caseId, id, It.IsAny<CancellationToken>()), Times.Once);
    }
}