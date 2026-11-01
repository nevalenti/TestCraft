using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TestCraft.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRunLogSeq : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_run_logs_run_id_created_at",
                table: "run_logs");

            migrationBuilder.AddColumn<long>(
                name: "seq",
                table: "run_logs",
                type: "bigint",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE run_logs
                SET seq = numbered.position
                FROM (
                    SELECT id, row_number() OVER (ORDER BY created_at, id) AS position
                    FROM run_logs
                ) AS numbered
                WHERE run_logs.id = numbered.id;

                ALTER TABLE run_logs ALTER COLUMN seq SET NOT NULL;
                ALTER TABLE run_logs ALTER COLUMN seq ADD GENERATED ALWAYS AS IDENTITY;
                SELECT setval(
                    pg_get_serial_sequence('run_logs', 'seq'),
                    COALESCE((SELECT max(seq) FROM run_logs), 0) + 1,
                    false
                );
                """);

            migrationBuilder.CreateIndex(
                name: "IX_run_logs_run_id_seq",
                table: "run_logs",
                columns: new[] { "run_id", "seq" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_run_logs_run_id_seq",
                table: "run_logs");

            migrationBuilder.DropColumn(
                name: "seq",
                table: "run_logs");

            migrationBuilder.CreateIndex(
                name: "IX_run_logs_run_id_created_at",
                table: "run_logs",
                columns: new[] { "run_id", "created_at" });
        }
    }
}
