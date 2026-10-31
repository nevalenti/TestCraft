using TestCraft.Domain.Common;
using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class TestCase : SoftDeletableEntity, IVersioned
{
    public TestCaseId Id { get; private set; }
    public int Version { get; private set; } = 1;
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public TestCasePriority Priority { get; private set; } = TestCasePriority.Medium;
    public TestSuiteId SuiteId { get; private set; }

    public TestSuite? Suite { get; }
    public ICollection<TestCaseStep> Steps { get; } = [];
    public ICollection<TestResult> TestResults { get; } = [];
    public ICollection<TestCaseLabel> TestCaseLabels { get; } = [];
    public ICollection<TestPlanCase> TestPlanCases { get; } = [];

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
