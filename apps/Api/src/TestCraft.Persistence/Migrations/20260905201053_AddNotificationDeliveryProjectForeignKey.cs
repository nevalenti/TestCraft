using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationDeliveryProjectForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_notification_deliveries_project_id",
                table: "notification_deliveries",
                column: "project_id");

            migrationBuilder.AddForeignKey(
                name: "FK_notification_deliveries_projects_project_id",
                table: "notification_deliveries",
                column: "project_id",
                principalTable: "projects",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_notification_deliveries_projects_project_id",
                table: "notification_deliveries");

            migrationBuilder.DropIndex(
                name: "IX_notification_deliveries_project_id",
                table: "notification_deliveries");
        }
    }
}
