using System.Reflection;

using FluentAssertions;

using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Architecture.Tests;

public class SensitiveConfigurationTests
{
    private static readonly Assembly[] Assemblies =
    [
        typeof(IStartupOptions).Assembly,
        typeof(Program).Assembly,
    ];

    [Fact]
    public void StartupOptionsProperties_ShouldBeExplicitlyMarkedSensitiveOrNotSensitive()
    {
        var unmarkedProperties = Assemblies
            .SelectMany(assembly => assembly.GetTypes())
            .Where(type => !type.IsInterface && typeof(IStartupOptions).IsAssignableFrom(type))
            .SelectMany(type => type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            .Where(property =>
                property.GetCustomAttribute<SensitiveAttribute>() is null
                && property.GetCustomAttribute<NotSensitiveAttribute>() is null
            )
            .Select(property => $"{property.DeclaringType!.FullName}.{property.Name}")
            .ToList();

        unmarkedProperties
            .Should()
            .BeEmpty(
                "every IStartupOptions property must be explicitly marked [Sensitive] or "
                    + "[NotSensitive] so it can't silently ship unredacted in the startup "
                    + "configuration log"
            );
    }
}
