using Microsoft.EntityFrameworkCore;

using Npgsql;

using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Infrastructure.Persistence;

public class PostgresExceptionClassifier : IDbExceptionClassifier
{
    public bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };

    public bool IsForeignKeyViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.ForeignKeyViolation };
}
