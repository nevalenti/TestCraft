namespace TestCraft.Api.Authorization;

[AttributeUsage(AttributeTargets.Class)]
public sealed class ApiTokenScopeAttribute(string resource) : Attribute
{
    public string Resource { get; } = resource;
}
