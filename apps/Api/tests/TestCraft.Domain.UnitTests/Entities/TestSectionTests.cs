using FluentAssertions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestSectionTests
{
    [Fact]
    public void Create_WithEmptyName_ThrowsDomainException()
    {
        var act = () => TestSection.Create(TestSuiteId.New(), null, " ", null, 1);

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void MoveTo_SetsParentAndPosition()
    {
        var section = TestSection.Create(TestSuiteId.New(), null, "Cards", null, 1);
        var parentId = TestSectionId.New();

        section.MoveTo(parentId, 3);

        (section.ParentId, section.Position).Should().Be((parentId, 3));
    }
}
