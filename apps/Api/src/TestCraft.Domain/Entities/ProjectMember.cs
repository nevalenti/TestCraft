namespace TestCraft.Domain.Entities;

public class ProjectMember
{
    public ProjectMemberId Id { get; set; }
    public ProjectId ProjectId { get; set; }
    public UserId UserId { get; set; }
    public required string Email { get; set; }
    public string? DisplayName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; set; }
}
