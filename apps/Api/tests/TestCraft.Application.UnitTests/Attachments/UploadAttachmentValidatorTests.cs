using FluentValidation.TestHelper;
using TestCraft.Application.Features.Attachments;

namespace TestCraft.Application.UnitTests.Attachments;

public class UploadAttachmentValidatorTests
{
    private readonly UploadAttachment.Validator _validator = new();

    private static UploadAttachment.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ResultId = Guid.NewGuid(),
            FileName = "screenshot.png",
            ContentType = "image/png",
            SizeBytes = 1024,
            Content = new MemoryStream("fake"u8.ToArray()),
        };

    [Fact]
    public void ValidCommand_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("text/html")]
    [InlineData("application/xhtml+xml")]
    [InlineData("image/svg+xml")]
    public void ScriptCapableContentType_FailsValidation(string contentType)
    {
        var result = _validator.TestValidate(ValidCommand() with { ContentType = contentType });
        result.ShouldHaveValidationErrorFor(command => command.ContentType);
    }

    [Fact]
    public void ArbitraryBinaryContentType_PassesValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                ContentType = "application/x-msdownload",
            }
        );
        result.ShouldNotHaveValidationErrorFor(command => command.ContentType);
    }

    [Fact]
    public void SizeExceedingMaxLimit_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { SizeBytes = 52_428_800 + 1 });
        result.ShouldHaveValidationErrorFor(command => command.SizeBytes);
    }

    [Fact]
    public void ZeroSize_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { SizeBytes = 0 });
        result.ShouldNotHaveValidationErrorFor(command => command.SizeBytes);
    }
}
