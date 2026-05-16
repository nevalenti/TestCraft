namespace Application.Projects;

public record ProjectDto(Guid Id, string Name, string? Description, DateTime CreatedAt);
public record CreateProjectDto(string Name, string? Description);
public record UpdateProjectDto(string Name, string? Description);