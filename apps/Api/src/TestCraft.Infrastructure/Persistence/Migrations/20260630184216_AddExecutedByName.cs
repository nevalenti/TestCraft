using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExecutedByName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "executed_by_name",
                table: "test_runs",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "executed_by_name", table: "test_runs");
        }
    }
}
