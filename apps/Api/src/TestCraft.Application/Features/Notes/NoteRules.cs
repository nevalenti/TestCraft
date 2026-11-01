using FluentValidation;
using TestCraft.Application.Common.Validation;

namespace TestCraft.Application.Features.Notes;

internal static class NoteRules
{
    public const int MaxTitleLength = 255;
    public const int MaxLanguageLength = 50;
    public const int MaxContentLength = 1_000_000;
    public const string ContentType = "text/plain";

    public static void Title<T>(IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().MaximumLength(MaxTitleLength).SingleLine();

    public static void Language<T>(IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().MaximumLength(MaxLanguageLength).SingleLine();

    public static void Content<T>(IRuleBuilder<T, string> rule) =>
        rule.NotNull().MaximumLength(MaxContentLength);
}
