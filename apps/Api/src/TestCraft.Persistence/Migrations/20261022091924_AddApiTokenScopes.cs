using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddApiTokenScopes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "scopes",
                table: "api_tokens",
                type: "text[]",
                nullable: false,
                defaultValue: new[]
                {
                    "analytics_read", "cases_read", "cases_write", "imports_read", "imports_write",
                    "labels_read", "labels_write", "plans_read", "plans_write", "results_read",
                    "results_write", "runs_read", "runs_write", "suites_read", "suites_write"
                });

            migrationBuilder.Sql("ALTER TABLE api_tokens ALTER COLUMN scopes DROP DEFAULT");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "scopes",
                table: "api_tokens");
        }
    }
}
