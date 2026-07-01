using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRunLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "run_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(
                        type: "uuid",
                        nullable: false,
                        defaultValueSql: "gen_random_uuid()"
                    ),
                    run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "now()"
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_run_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_run_logs_test_runs_run_id",
                        column: x => x.run_id,
                        principalTable: "test_runs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_run_logs_run_id_created_at",
                table: "run_logs",
                columns: new[] { "run_id", "created_at" }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "run_logs");
        }
    }
}
