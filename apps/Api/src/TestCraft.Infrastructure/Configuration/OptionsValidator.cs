using System.ComponentModel.DataAnnotations;

namespace TestCraft.Infrastructure.Configuration;

public static class OptionsValidator
{
    public static T ValidateAndThrow<T>(T options, string contextName)
        where T : notnull
    {
        var results = new List<ValidationResult>();
        if (
            !Validator.TryValidateObject(
                options,
                new ValidationContext(options),
                results,
                validateAllProperties: true
            )
        )
        {
            throw new InvalidOperationException(
                $"Invalid {contextName} configuration: {string.Join("; ", results.Select(result => result.ErrorMessage))}"
            );
        }

        return options;
    }
}
