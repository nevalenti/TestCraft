using Api.Controllers;

using Application.TestCases;

using AwesomeAssertions;

using Domain.Enums;

using Microsoft.AspNetCore.Mvc;

using Moq;

using Xunit;

namespace Api.Tests.TestCases;

public class TestCasesControllerTests
{
    private readonly Mock<ITestCasesService> _service = new();
    private readonly TestCasesController _controller;

    public TestCasesControllerTests()
    {
        _controller = new TestCasesController(_service.Object);
    }

    [Fact]
    public async Task GetCases_ReturnsOkWithAllCases()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var cases = new List<TestCaseDto>
        {
            new(Guid.NewGuid(), suiteId, "Case A", null, TestCasePriority.Medium, 0, DateTime.UtcNow, null),
            new(Guid.NewGuid(), suiteId, "Case B", "desc", TestCasePriority.High, 2, DateTime.UtcNow, null)
        };
        _service.Setup(s => s.GetAllAsync(projectId, suiteId, It.IsAny<string?>(), It.IsAny<CancellationToken>())).ReturnsAsync(cases);

        var result = await _controller.GetCases(projectId, suiteId, null, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(cases);
    }

    [Fact]
    public async Task GetCases_WhenEmpty_ReturnsOkWithEmptyList()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        _service.Setup(s => s.GetAllAsync(projectId, suiteId, It.IsAny<string?>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var result = await _controller.GetCases(projectId, suiteId, null, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(Array.Empty<TestCaseDto>());
    }

    [Fact]
    public async Task GetCase_WhenFound_ReturnsOkWithCase()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var testCase = new TestCaseDto(id, suiteId, "Case A", null, TestCasePriority.Medium, 0, DateTime.UtcNow, null);
        _service.Setup(s => s.GetByIdAsync(projectId, suiteId, id, It.IsAny<CancellationToken>())).ReturnsAsync(testCase);

        var result = await _controller.GetCase(projectId, suiteId, id, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(testCase);
    }

    [Fact]
    public async Task GetCase_WhenNotFound_ReturnsNotFound()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        _service.Setup(s => s.GetByIdAsync(projectId, suiteId, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(default(TestCaseDto));

        var result = await _controller.GetCase(projectId, suiteId, Guid.NewGuid(), CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateCase_ReturnsCreatedAtActionWithCase()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var request = new CreateTestCaseDto("Case A", null);
        var created = new TestCaseDto(Guid.NewGuid(), suiteId, "Case A", null, TestCasePriority.Medium, 0, DateTime.UtcNow, null);
        _service.Setup(s => s.CreateAsync(projectId, suiteId, request, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await _controller.CreateCase(projectId, suiteId, request, CancellationToken.None);

        var createdAt = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdAt.ActionName.Should().Be(nameof(TestCasesController.GetCase));
        createdAt.RouteValues!["id"].Should().Be(created.Id);
        createdAt.Value.Should().Be(created);
        _service.Verify(s => s.CreateAsync(projectId, suiteId, request, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateCase_WhenParentNotFound_ReturnsNotFound()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        _service.Setup(s => s.CreateAsync(projectId, suiteId, It.IsAny<CreateTestCaseDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(default(TestCaseDto));

        var result = await _controller.CreateCase(projectId, suiteId, new CreateTestCaseDto("Case A", null), CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Theory]
    [InlineData(true, typeof(NoContentResult))]
    [InlineData(false, typeof(NotFoundResult))]
    public async Task UpdateCase_ReturnsCorrectResult(bool exists, Type expected)
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _service.Setup(s => s.UpdateAsync(projectId, suiteId, id, It.IsAny<UpdateTestCaseDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(exists);

        var result = await _controller.UpdateCase(projectId, suiteId, id, new UpdateTestCaseDto("Updated", null, TestCasePriority.Medium), CancellationToken.None);

        result.Should().BeOfType(expected);
        _service.Verify(s => s.UpdateAsync(projectId, suiteId, id, It.IsAny<UpdateTestCaseDto>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(true, typeof(NoContentResult))]
    [InlineData(false, typeof(NotFoundResult))]
    public async Task DeleteCase_ReturnsCorrectResult(bool exists, Type expected)
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _service.Setup(s => s.DeleteAsync(projectId, suiteId, id, It.IsAny<CancellationToken>())).ReturnsAsync(exists);

        var result = await _controller.DeleteCase(projectId, suiteId, id, CancellationToken.None);

        result.Should().BeOfType(expected);
        _service.Verify(s => s.DeleteAsync(projectId, suiteId, id, It.IsAny<CancellationToken>()), Times.Once);
    }
}