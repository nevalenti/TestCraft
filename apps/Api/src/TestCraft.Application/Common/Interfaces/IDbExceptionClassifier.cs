using Microsoft.EntityFrameworkCore;

namespace TestCraft.Application.Common.Interfaces;

public interface IDbExceptionClassifier
{
    bool IsUniqueViolation(DbUpdateException ex);

    bool IsForeignKeyViolation(DbUpdateException ex);
}
