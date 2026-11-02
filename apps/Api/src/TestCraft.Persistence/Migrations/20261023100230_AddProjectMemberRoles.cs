using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectMemberRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "role",
                table: "project_members",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Editor");

            migrationBuilder.Sql("ALTER TABLE project_members ALTER COLUMN role DROP DEFAULT;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "role",
                table: "project_members");
        }
    }
}
