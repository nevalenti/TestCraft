using System.Reflection;

using FluentAssertions;

using NetArchTest.Rules;

namespace TestCraft.Architecture.Tests;

public class LayeringTests
{
    private static readonly Assembly DomainAssembly = typeof(Domain.Entities.Project).Assembly;
    private static readonly Assembly ApplicationAssembly =
        typeof(Application.DependencyInjection).Assembly;
    private static readonly Assembly PersistenceAssembly =
        typeof(Persistence.DependencyInjection).Assembly;
    private static readonly Assembly InfrastructureAssembly =
        typeof(Infrastructure.DependencyInjection).Assembly;
    private static readonly Assembly ApiAssembly = typeof(Program).Assembly;

    [Fact]
    public void Domain_ShouldNotDependOnOtherLayers()
    {
        var result = Types
            .InAssembly(DomainAssembly)
            .Should()
            .NotHaveDependencyOnAny(
                ApplicationAssembly.GetName().Name,
                PersistenceAssembly.GetName().Name,
                InfrastructureAssembly.GetName().Name,
                ApiAssembly.GetName().Name
            )
            .GetResult();

        result.IsSuccessful.Should().BeTrue(FailureMessage(result));
    }

    [Fact]
    public void Application_ShouldNotDependOnPersistenceInfrastructureOrApi()
    {
        var result = Types
            .InAssembly(ApplicationAssembly)
            .Should()
            .NotHaveDependencyOnAny(
                PersistenceAssembly.GetName().Name,
                InfrastructureAssembly.GetName().Name,
                ApiAssembly.GetName().Name
            )
            .GetResult();

        result.IsSuccessful.Should().BeTrue(FailureMessage(result));
    }

    [Fact]
    public void Persistence_ShouldNotDependOnInfrastructureOrApi()
    {
        var result = Types
            .InAssembly(PersistenceAssembly)
            .Should()
            .NotHaveDependencyOnAny(
                InfrastructureAssembly.GetName().Name,
                ApiAssembly.GetName().Name
            )
            .GetResult();

        result.IsSuccessful.Should().BeTrue(FailureMessage(result));
    }

    [Fact]
    public void Infrastructure_ShouldNotDependOnApi()
    {
        var result = Types
            .InAssembly(InfrastructureAssembly)
            .Should()
            .NotHaveDependencyOnAny(ApiAssembly.GetName().Name)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(FailureMessage(result));
    }

    private static string FailureMessage(TestResult result) =>
        $"Types violating the layering rule: {string.Join(", ", result.FailingTypeNames ?? [])}";
}
