namespace TestCraft.Domain.Entities;

public class TestCaseLabel
{
    public TestCaseId TestCaseId { get; set; }
    public LabelId LabelId { get; set; }

    public TestCase? TestCase { get; set; }
    public Label? Label { get; set; }
}
