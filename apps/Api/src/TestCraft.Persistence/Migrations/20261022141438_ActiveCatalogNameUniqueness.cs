using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ActiveCatalogNameUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                LOCK TABLE test_suites, test_cases IN SHARE ROW EXCLUSIVE MODE;
                DO $$
                DECLARE duplicate text;
                BEGIN
                    SELECT format('project_id=%s, name=%L, ids=%s', project_id, name, array_agg(id ORDER BY id))
                    INTO duplicate
                    FROM test_suites
                    WHERE NOT is_deleted
                    GROUP BY project_id, name
                    HAVING count(*) > 1
                    LIMIT 1;
                    IF duplicate IS NOT NULL THEN
                        RAISE EXCEPTION 'Resolve duplicate active test suite names before migrating: %', duplicate;
                    END IF;

                    SELECT format('suite_id=%s, name=%L, ids=%s', suite_id, name, array_agg(id ORDER BY id))
                    INTO duplicate
                    FROM test_cases
                    WHERE NOT is_deleted
                    GROUP BY suite_id, name
                    HAVING count(*) > 1
                    LIMIT 1;
                    IF duplicate IS NOT NULL THEN
                        RAISE EXCEPTION 'Resolve duplicate active test case names before migrating: %', duplicate;
                    END IF;
                END $$;
                """);

            migrationBuilder.CreateIndex(
                name: "uq_test_suites_active_name",
                table: "test_suites",
                columns: new[] { "project_id", "name" },
                unique: true,
                filter: "NOT is_deleted");

            migrationBuilder.CreateIndex(
                name: "uq_test_cases_active_name",
                table: "test_cases",
                columns: new[] { "suite_id", "name" },
                unique: true,
                filter: "NOT is_deleted");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "uq_test_suites_active_name",
                table: "test_suites");

            migrationBuilder.DropIndex(
                name: "uq_test_cases_active_name",
                table: "test_cases");
        }
    }
}
