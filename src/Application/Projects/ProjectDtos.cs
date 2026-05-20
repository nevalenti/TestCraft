namespace Application.Projects;

public record ProjectDto(Guid Id, string Name, string? Description, DateTime CreatedAt, DateTime? UpdatedAt, int SuiteCount = 0, int RunCount = 0);
public record CreateProjectDto(string Name, string? Description);
public record UpdateProjectDto(string Name, string? Description);