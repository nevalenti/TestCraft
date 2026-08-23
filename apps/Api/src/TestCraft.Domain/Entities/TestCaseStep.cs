namespace TestCraft.Domain.Entities;

public class TestCaseStep : SoftDeletableEntity
{
    public TestCaseStepId Id { get; set; }
    public int Order { get; set; }
    public required string Action { get; set; }
    public required string ExpectedResult { get; set; }
    public TestCaseId TestCaseId { get; set; }

    public TestCase? TestCase { get; set; }
}
