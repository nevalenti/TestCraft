using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTestSections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_test_cases_suite_id",
                table: "test_cases");

            migrationBuilder.AddColumn<int>(
                name: "position",
                table: "test_cases",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "section_id",
                table: "test_cases",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE test_cases
                SET position = ordered.position
                FROM (
                    SELECT id, row_number() OVER (PARTITION BY suite_id ORDER BY created_at, id) AS position
                    FROM test_cases
                ) AS ordered
                WHERE test_cases.id = ordered.id;
                """
            );

            migrationBuilder.CreateTable(
                name: "test_sections",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    suite_id = table.Column<Guid>(type: "uuid", nullable: false),
                    parent_id = table.Column<Guid>(type: "uuid", nullable: true),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    position = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_test_sections", x => x.id);
                    table.ForeignKey(
                        name: "FK_test_sections_test_sections_parent_id",
                        column: x => x.parent_id,
                        principalTable: "test_sections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_test_sections_test_suites_suite_id",
                        column: x => x.suite_id,
                        principalTable: "test_suites",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_test_cases_section_id",
                table: "test_cases",
                column: "section_id");

            migrationBuilder.CreateIndex(
                name: "IX_test_cases_suite_id_section_id_position",
                table: "test_cases",
                columns: new[] { "suite_id", "section_id", "position" });

            migrationBuilder.CreateIndex(
                name: "IX_test_sections_parent_id",
                table: "test_sections",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "uq_test_sections_active_name",
                table: "test_sections",
                columns: new[] { "suite_id", "parent_id", "name" },
                unique: true,
                filter: "NOT is_deleted")
                .Annotation("Npgsql:NullsDistinct", false);

            migrationBuilder.AddForeignKey(
                name: "FK_test_cases_test_sections_section_id",
                table: "test_cases",
                column: "section_id",
                principalTable: "test_sections",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_test_cases_test_sections_section_id",
                table: "test_cases");

            migrationBuilder.DropTable(
                name: "test_sections");

            migrationBuilder.DropIndex(
                name: "IX_test_cases_section_id",
                table: "test_cases");

            migrationBuilder.DropIndex(
                name: "IX_test_cases_suite_id_section_id_position",
                table: "test_cases");

            migrationBuilder.DropColumn(
                name: "position",
                table: "test_cases");

            migrationBuilder.DropColumn(
                name: "section_id",
                table: "test_cases");

            migrationBuilder.CreateIndex(
                name: "IX_test_cases_suite_id",
                table: "test_cases",
                column: "suite_id");
        }
    }
}
