namespace Domain.Entities;

public class TestCaseStep : BaseEntity
{
    public int Order { get; set; }
    public string Action { get; set; } = string.Empty;
    public string ExpectedResult { get; set; } = string.Empty;

    public Guid TestCaseId { get; set; }
    public TestCase TestCase { get; set; } = null!;
}