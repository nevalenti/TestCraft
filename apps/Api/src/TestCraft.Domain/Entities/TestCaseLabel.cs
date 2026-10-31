namespace TestCraft.Domain.Entities;

public class TestCaseLabel
{
    public TestCaseId TestCaseId { get; private set; }
    public LabelId LabelId { get; private set; }

    public TestCase? TestCase { get; }
    public Label? Label { get; }

    public static TestCaseLabel Create(TestCaseId testCaseId, LabelId labelId) =>
        new() { TestCaseId = testCaseId, LabelId = labelId };
}
