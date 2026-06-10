namespace TestCraft.Application.Common.Security;

public interface IProjectScopedRequest
{
    Guid ProjectId { get; }
}
