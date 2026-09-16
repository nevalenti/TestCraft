using TestCraft.Domain.Common;
using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class TestCase : SoftDeletableEntity
{
    public TestCaseId Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public TestCasePriority Priority { get; private set; } = TestCasePriority.Medium;
    public TestSuiteId SuiteId { get; private set; }

    public TestSuite? Suite { get; set; }
    public ICollection<TestCaseStep> Steps { get; set; } = [];
    public ICollection<TestResult> TestResults { get; set; } = [];
    public ICollection<TestCaseLabel> TestCaseLabels { get; set; } = [];
    public ICollection<TestPlanCase> TestPlanCases { get; set; } = [];

    public static TestCase Create(
        TestSuiteId suiteId,
        string name,
        string? description = null,
        TestCasePriority priority = TestCasePriority.Medium
    ) =>
        new()
        {
            Id = TestCaseId.New(),
            SuiteId = suiteId,
            Name = Guard.AgainstEmpty(name, nameof(Name)),
            Description = description,
            Priority = priority,
        };

    public void Update(string name, string? description, TestCasePriority priority)
    {
        Name = Guard.AgainstEmpty(name, nameof(Name));
        Description = description;
        Priority = priority;
    }
}
