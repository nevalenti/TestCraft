using Application.TestCases;
using Application.TestSuites;

using AwesomeAssertions;

using Domain.Entities;
using Domain.Enums;

using Moq;

using Xunit;

namespace Application.Tests.TestCases;

public class TestCasesServiceTests
{
    private readonly Mock<ITestSuiteRepository> _suites = new();
    private readonly Mock<ITestCaseRepository> _cases = new();
    private readonly TestCasesService _service;

    public TestCasesServiceTests()
    {
        _service = new TestCasesService(_suites.Object, _cases.Object);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsRepositoryResult()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var expected = new List<TestCaseDto> { new(Guid.NewGuid(), suiteId, "Case A", null, TestCasePriority.Medium, 0, DateTime.UtcNow, null) };
        _cases.Setup(r => r.GetAllAsync(projectId, suiteId, It.IsAny<string?>(), It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.GetAllAsync(projectId, suiteId);

        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var expected = new TestCaseDto(id, suiteId, "Case A", null, TestCasePriority.Medium, 0, DateTime.UtcNow, null);
        _cases.Setup(r => r.GetByIdAsync(projectId, suiteId, id, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.GetByIdAsync(projectId, suiteId, id);

        result.Should().Be(expected);
    }

    [Fact]
    public async Task CreateAsync_WhenSuiteNotFound_ReturnsNullAndDoesNotAddCase()
    {
        _suites.Setup(r => r.ExistsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await _service.CreateAsync(Guid.NewGuid(), Guid.NewGuid(), new CreateTestCaseDto("Case", null));

        result.Should().BeNull();
        _cases.Verify(r => r.AddAsync(It.IsAny<TestCase>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WhenSuiteFound_AddsWithCorrectProperties()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var dto = new CreateTestCaseDto("Case A", "desc");
        var expected = new TestCaseDto(Guid.NewGuid(), suiteId, "Case A", "desc", TestCasePriority.Medium, 0, DateTime.UtcNow, null);
        _suites.Setup(r => r.ExistsAsync(projectId, suiteId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _cases.Setup(r => r.AddAsync(It.IsAny<TestCase>(), It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await _service.CreateAsync(projectId, suiteId, dto);

        result.Should().Be(expected);
        _cases.Verify(r => r.AddAsync(
            It.Is<TestCase>(c => c.Name == dto.Name && c.Description == dto.Description && c.SuiteId == suiteId),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_AppliesCorrectMutation()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var dto = new UpdateTestCaseDto("Updated", "New desc", TestCasePriority.High);
        Action<TestCase>? captured = null;
        _cases.Setup(r => r.UpdateAsync(projectId, suiteId, id, It.IsAny<Action<TestCase>>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, Guid, Guid, Action<TestCase>, CancellationToken>((_, _, _, mutate, _) => captured = mutate)
            .ReturnsAsync(true);

        var result = await _service.UpdateAsync(projectId, suiteId, id, dto);

        result.Should().BeTrue();
        var testCase = new TestCase { Name = "Old", Description = "Old" };
        captured!(testCase);
        testCase.Name.Should().Be("Updated");
        testCase.Description.Should().Be("New desc");
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepository()
    {
        var projectId = Guid.NewGuid();
        var suiteId = Guid.NewGuid();
        var id = Guid.NewGuid();
        _cases.Setup(r => r.DeleteAsync(projectId, suiteId, id, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _service.DeleteAsync(projectId, suiteId, id);

        result.Should().BeTrue();
    }
}