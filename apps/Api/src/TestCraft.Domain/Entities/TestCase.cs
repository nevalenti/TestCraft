using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class TestCase : SoftDeletableEntity
{
    public TestCaseId Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public TestCasePriority Priority { get; set; } = TestCasePriority.Medium;
    public TestSuiteId SuiteId { get; set; }

    public TestSuite? Suite { get; set; }
    public ICollection<TestCaseStep> Steps { get; set; } = [];
    public ICollection<TestResult> TestResults { get; set; } = [];
    public ICollection<TestCaseLabel> TestCaseLabels { get; set; } = [];
    public ICollection<TestPlanCase> TestPlanCases { get; set; } = [];

    public void Update(string name, string? description, TestCasePriority priority)
    {
        Name = name;
        Description = description;
        Priority = priority;
    }
}
