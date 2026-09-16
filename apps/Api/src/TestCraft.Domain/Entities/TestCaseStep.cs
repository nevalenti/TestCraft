using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class TestCaseStep : SoftDeletableEntity
{
    public TestCaseStepId Id { get; private set; }
    public int Order { get; private set; }
    public string Action { get; private set; } = null!;
    public string ExpectedResult { get; private set; } = null!;
    public TestCaseId TestCaseId { get; private set; }

    public TestCase? TestCase { get; set; }

    public static TestCaseStep Create(
        TestCaseId testCaseId,
        int order,
        string action,
        string expectedResult
    ) =>
        new()
        {
            Id = TestCaseStepId.New(),
            TestCaseId = testCaseId,
            Order = order,
            Action = Guard.AgainstEmpty(action, nameof(Action)),
            ExpectedResult = Guard.AgainstEmpty(expectedResult, nameof(ExpectedResult)),
        };

    public void Update(int order, string action, string expectedResult)
    {
        Order = order;
        Action = Guard.AgainstEmpty(action, nameof(Action));
        ExpectedResult = Guard.AgainstEmpty(expectedResult, nameof(ExpectedResult));
    }

    public void Reorder(int order) => Order = order;
}
