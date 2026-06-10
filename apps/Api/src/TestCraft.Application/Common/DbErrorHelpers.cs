using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace TestCraft.Application.Common;

public static class DbErrorHelpers
{
    public static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException
            is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            };

    public static bool IsForeignKeyViolation(DbUpdateException ex) =>
        ex.InnerException
            is PostgresException
            {
                SqlState: PostgresErrorCodes.ForeignKeyViolation
            };
}
