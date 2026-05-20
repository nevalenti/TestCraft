using Application.TestCases;
using Application.TestCaseSteps;

using AwesomeAssertions;

using Domain.Entities;

using Moq;

using Xunit;

namespace Application.Tests.TestCaseSteps;

public class TestCaseStepsServiceTests
{
    private readonly Mock<ITestCaseRepository> _cases = new();
    private readonly Mock<ITestCaseStepRepository> _steps = new();
    private readonly TestCaseStepsService _service;

    public TestCaseStepsServiceTests()
    {
        _service = new TestCaseStepsService(_cases.Object, _steps.Object);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsRepositoryResult()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var expected = new List<TestCaseStepDto> { new(Guid.NewGuid(), caseId, 1, "Click", "Page opens", DateTime.UtcNow, null) };
        _steps.Setup(r => r.GetAllAsync(projectId, suiteId, caseId, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.GetAllAsync(projectId, suiteId, caseId);

        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var expected = new TestCaseStepDto(id, caseId, 1, "Click", "Page opens", DateTime.UtcNow, null);
        _steps.Setup(r => r.GetByIdAsync(projectId, suiteId, caseId, id, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.GetByIdAsync(projectId, suiteId, caseId, id);

        result.Should().Be(expected);
    }

    [Fact]
    public async Task CreateAsync_WhenCaseNotFound_ReturnsNullAndDoesNotAddStep()
    {
        _cases.Setup(r => r.ExistsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await _service.CreateAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), new CreateTestCaseStepDto(1, "Click", "Opens"));

        result.Should().BeNull();
        _steps.Verify(r => r.AddAsync(It.IsAny<TestCaseStep>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WhenCaseFound_AddsWithCorrectProperties()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var dto = new CreateTestCaseStepDto(2, "Click button", "Dialog appears");
        var expected = new TestCaseStepDto(Guid.NewGuid(), caseId, 2, "Click button", "Dialog appears", DateTime.UtcNow, null);
        _cases.Setup(r => r.ExistsAsync(projectId, suiteId, caseId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _steps.Setup(r => r.AddAsync(It.IsAny<TestCaseStep>(), It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.CreateAsync(projectId, suiteId, caseId, dto);

        result.Should().Be(expected);
        _steps.Verify(r => r.AddAsync(
            It.Is<TestCaseStep>(s => s.Order == 2 && s.Action == "Click button" && s.ExpectedResult == "Dialog appears" && s.TestCaseId == caseId),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_AppliesCorrectMutation()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var dto = new UpdateTestCaseStepDto(3, "New action", "New result");
        Action<TestCaseStep>? captured = null;
        _steps.Setup(r => r.UpdateAsync(projectId, suiteId, caseId, id, It.IsAny<Action<TestCaseStep>>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, Guid, Guid, Guid, Action<TestCaseStep>, CancellationToken>((_, _, _, _, mutate, _) => captured = mutate)
            .ReturnsAsync(true);

        var result = await _service.UpdateAsync(projectId, suiteId, caseId, id, dto);

        result.Should().BeTrue();
        var step = new TestCaseStep { Order = 1, Action = "Old", ExpectedResult = "Old" };
        captured!(step);
        step.Order.Should().Be(3);
        step.Action.Should().Be("New action");
        step.ExpectedResult.Should().Be("New result");
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepository()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var caseId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _steps.Setup(r => r.DeleteAsync(projectId, suiteId, caseId, id, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _service.DeleteAsync(projectId, suiteId, caseId, id);

        result.Should().BeTrue();
    }
}