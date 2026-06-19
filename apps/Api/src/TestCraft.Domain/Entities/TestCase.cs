using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class TestCase : IAuditableEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public TestCasePriority Priority { get; set; } = TestCasePriority.Medium;
    public Guid SuiteId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public TestSuite? Suite { get; set; }
    public ICollection<TestCaseStep> Steps { get; set; } = [];
    public ICollection<TestResult> TestResults { get; set; } = [];
    public ICollection<TestCaseLabel> TestCaseLabels { get; set; } = [];
    public ICollection<TestPlanCase> TestPlanCases { get; set; } = [];
}
