namespace TestCraft.Domain.Entities;

public class TestCaseLabel
{
    public Guid TestCaseId { get; set; }
    public Guid LabelId { get; set; }

    public TestCase? TestCase { get; set; }
    public Label? Label { get; set; }
}
