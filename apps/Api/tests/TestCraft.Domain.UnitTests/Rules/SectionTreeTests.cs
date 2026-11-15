using FluentAssertions;
using TestCraft.Domain.Common;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Rules;

public class SectionTreeTests
{
    private static readonly TestSuiteId Suite = TestSuiteId.New();

    private static List<TestSection> Chain(int length)
    {
        var sections = new List<TestSection>();
        TestSectionId? parentId = null;
        for (var level = 1; level <= length; level++)
        {
            var section = TestSection.Create(Suite, parentId, $"Level {level}", null, 1);
            sections.Add(section);
            parentId = section.Id;
        }

        return sections;
    }

    [Fact]
    public void Subtree_ContainsSectionAndAllDescendants()
    {
        var chain = Chain(3);
        var sibling = TestSection.Create(Suite, null, "Sibling", null, 2);
        var tree = new SectionTree([.. chain, sibling]);

        tree.Subtree(chain[0].Id).Should().BeEquivalentTo(chain.Select(section => section.Id));
    }

    [Fact]
    public void Depth_CountsLevelsFromTheTop()
    {
        var chain = Chain(3);

        new SectionTree(chain).Depth(chain[2].Id).Should().Be(3);
    }

    [Fact]
    public void NextPosition_IsOneAfterTheLastSibling()
    {
        var first = TestSection.Create(Suite, null, "First", null, 1);
        var second = TestSection.Create(Suite, null, "Second", null, 4);
        var tree = new SectionTree([first, second]);

        tree.NextPosition(null).Should().Be(5);
        tree.NextPosition(first.Id).Should().Be(1);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(2)]
    public void EnsureCanMove_IntoItselfOrADescendant_ThrowsSectionCycle(int target)
    {
        var chain = Chain(3);

        var act = () => new SectionTree(chain).EnsureCanMove(chain[0].Id, chain[target].Id);

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.SectionCycle);
    }

    [Fact]
    public void EnsureCanMove_WhenSubtreeWouldExceedMaxDepth_ThrowsSectionTooDeep()
    {
        var chain = Chain(SectionTree.MaxDepth - 1);
        var branch = TestSection.Create(Suite, null, "Branch", null, 2);
        var leaf = TestSection.Create(Suite, branch.Id, "Leaf", null, 1);
        var tree = new SectionTree([.. chain, branch, leaf]);

        tree.Invoking(sections => sections.EnsureCanMove(branch.Id, chain[^2].Id))
            .Should()
            .NotThrow();
        tree.Invoking(sections => sections.EnsureCanMove(branch.Id, chain[^1].Id))
            .Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.SectionTooDeep);
    }

    [Fact]
    public void EnsureCanAdd_UnderDeepestAllowedLevel_ThrowsSectionTooDeep()
    {
        var chain = Chain(SectionTree.MaxDepth);

        var act = () => new SectionTree(chain).EnsureCanAdd(chain[^1].Id);

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.SectionTooDeep);
    }
}
