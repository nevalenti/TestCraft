using FluentValidation.TestHelper;
using TestCraft.Application.Features.Import;

namespace TestCraft.Application.UnitTests.Import;

public class ImportJUnitValidatorTests
{
    private readonly ImportJUnit.Validator _validator = new();

    private static ImportJUnit.Command ValidCommand() =>
        new()
        {
            ProjectId = ProjectId.New(),
            Xml = "<testsuites></testsuites>",
            Environment = "ci",
        };

    [Fact]
    public void ValidCommand_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyOrWhitespaceXml_FailsValidation(string xml)
    {
        var result = _validator.TestValidate(ValidCommand() with { Xml = xml });
        result.ShouldHaveValidationErrorFor(command => command.Xml);
    }

    [Fact]
    public void XmlExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Xml = new string('a', 4_500_001),
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.Xml);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyOrWhitespaceEnvironment_FailsValidation(string environment)
    {
        var result = _validator.TestValidate(ValidCommand() with { Environment = environment });
        result.ShouldHaveValidationErrorFor(command => command.Environment);
    }

    [Fact]
    public void NullName_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Name = null });
        result.ShouldNotHaveValidationErrorFor(command => command.Name);
    }

    [Fact]
    public void EmptyName_FailsValidationOnlyWhenProvided()
    {
        var result = _validator.TestValidate(ValidCommand() with { Name = "" });
        result.ShouldHaveValidationErrorFor(command => command.Name);
    }

    [Fact]
    public void NullSource_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Source = null });
        result.ShouldNotHaveValidationErrorFor(command => command.Source);
    }

    [Fact]
    public void SourceExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Source = new string('a', 101) });
        result.ShouldHaveValidationErrorFor(command => command.Source);
    }
}
