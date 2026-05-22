using Domain.Enums;

namespace Domain.Entities;

public class TestCase : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TestCasePriority Priority { get; set; } = TestCasePriority.Medium;

    public Guid SuiteId { get; set; }
    public TestSuite Suite { get; set; } = null!;

    public ICollection<TestCaseStep> Steps { get; set; } = [];
    public ICollection<TestResult> TestResults { get; set; } = [];
}