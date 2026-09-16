using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class AttachmentTests
{
    [Fact]
    public void Create_WithEmptyFileName_ThrowsDomainException()
    {
        var act = () =>
            Attachment.Create(
                TestResultId.New(),
                "",
                "image/png",
                1024,
                "storage/key",
                UserId.New()
            );

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Create_WithEmptyContentType_ThrowsDomainException()
    {
        var act = () =>
            Attachment.Create(
                TestResultId.New(),
                "screenshot.png",
                "",
                1024,
                "storage/key",
                UserId.New()
            );

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Create_SetsFields()
    {
        var testResultId = TestResultId.New();
        var createdById = UserId.New();

        var attachment = Attachment.Create(
            testResultId,
            "screenshot.png",
            "image/png",
            2048,
            "storage/key",
            createdById
        );

        attachment.TestResultId.Should().Be(testResultId);
        attachment.FileName.Should().Be("screenshot.png");
        attachment.ContentType.Should().Be("image/png");
        attachment.SizeBytes.Should().Be(2048);
        attachment.StorageKey.Should().Be("storage/key");
        attachment.CreatedById.Should().Be(createdById);
    }
}
