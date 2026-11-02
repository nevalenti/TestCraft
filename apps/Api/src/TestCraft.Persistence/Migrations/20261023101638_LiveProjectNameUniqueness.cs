using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LiveProjectNameUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_projects_user_id_name",
                table: "projects");

            migrationBuilder.CreateIndex(
                name: "IX_projects_user_id_name",
                table: "projects",
                columns: new[] { "user_id", "name" },
                unique: true,
                filter: "NOT is_deleted");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_projects_user_id_name",
                table: "projects");

            migrationBuilder.CreateIndex(
                name: "IX_projects_user_id_name",
                table: "projects",
                columns: new[] { "user_id", "name" },
                unique: true);
        }
    }
}
