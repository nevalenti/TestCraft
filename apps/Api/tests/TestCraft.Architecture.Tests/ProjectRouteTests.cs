using System.Reflection;
using System.Text.RegularExpressions;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using TestCraft.Api.Features.Projects;

namespace TestCraft.Architecture.Tests;

public partial class ProjectRouteTests
{
    [Fact]
    public void ProjectScopedRoutes_ShouldNameTheProjectRouteValueProjectId()
    {
        var misnamed = typeof(Program)
            .Assembly.GetTypes()
            .Where(type =>
                typeof(ControllerBase).IsAssignableFrom(type)
                && !type.IsAbstract
                && type != typeof(ProjectsController)
            )
            .SelectMany(controller =>
                controller
                    .GetMethods(
                        BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly
                    )
                    .SelectMany(action =>
                        action
                            .GetCustomAttributes<HttpMethodAttribute>()
                            .Select(method =>
                                $"{controller.GetCustomAttribute<RouteAttribute>()?.Template}/{method.Template}"
                            )
                    )
            )
            .Where(template =>
                ProjectSegment().Match(template) is { Success: true } match
                && match.Groups["name"].Value != "projectId"
            )
            .ToList();

        misnamed.Should().BeEmpty();
    }

    [GeneratedRegex(@"projects/\{(?<name>[A-Za-z]+)")]
    private static partial Regex ProjectSegment();
}
