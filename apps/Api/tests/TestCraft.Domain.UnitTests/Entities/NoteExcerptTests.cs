using FluentAssertions;
using TestCraft.Domain.Entities;

namespace TestCraft.Domain.UnitTests.Entities;

public class NoteExcerptTests
{
    [Theory]
    [InlineData("", "")]
    [InlineData("# Deploy\n\nRun **migrations** first.", "Deploy Run migrations first.")]
    [InlineData("- [x] build\n- [ ] ship\n1. tag", "build ship tag")]
    [InlineData("> quoted `code` and [a link](https://example.com)", "quoted code and a link")]
    [InlineData("Intro\n```sh\nmake deploy\n```\nDone", "Intro make deploy Done")]
    [InlineData("snake_case stays", "snake_case stays")]
    public void Build_Markdown_StripsMarkup(string content, string expected)
    {
        NoteExcerpt.Build(content, "markdown").Should().Be(expected);
    }

    [Fact]
    public void Build_Code_KeepsSourceCharacters()
    {
        NoteExcerpt.Build("# comment\nprint(1)", "python").Should().Be("# comment print(1)");
    }

    [Fact]
    public void Build_LongContent_IsTruncated()
    {
        NoteExcerpt
            .Build(string.Concat(Enumerable.Repeat("word ", 100)), "plaintext")
            .Should()
            .HaveLength(NoteExcerpt.Length);
    }

    [Fact]
    public void Build_DoesNotSplitAnEmojiAtTheCut()
    {
        var content = new string('a', NoteExcerpt.Length - 1) + "😀 more";

        NoteExcerpt
            .Build(content, "plaintext")
            .Should()
            .Be(new string('a', NoteExcerpt.Length - 1));
    }
}
