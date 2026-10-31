using TestCraft.Domain.Exceptions;

namespace TestCraft.Application.Common.Exceptions;

public static class CatalogConflicts
{
    public static ConflictException ProjectNameTaken() =>
        new("A project with this name already exists", DomainErrorCodes.ProjectNameTaken);

    public static ConflictException SuiteNameTaken() =>
        new("An active suite with this name already exists");

    public static ConflictException CaseNameTaken() =>
        new("An active test case with this name already exists");
}
