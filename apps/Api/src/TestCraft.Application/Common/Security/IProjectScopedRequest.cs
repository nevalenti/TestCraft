namespace TestCraft.Application.Common.Security;

public interface IProjectScopedRequest
{
    ProjectId ProjectId { get; }
}
