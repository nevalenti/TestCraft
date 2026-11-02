using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRowVersions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "webhook_subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "test_suites",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AlterColumn<int>(
                name: "version",
                table: "test_runs",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "test_results",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "test_plans",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "test_cases",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "test_case_steps",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "projects",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "labels",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "version",
                table: "email_subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "version",
                table: "webhook_subscriptions");

            migrationBuilder.DropColumn(
                name: "version",
                table: "test_suites");

            migrationBuilder.DropColumn(
                name: "version",
                table: "test_results");

            migrationBuilder.DropColumn(
                name: "version",
                table: "test_plans");

            migrationBuilder.DropColumn(
                name: "version",
                table: "test_cases");

            migrationBuilder.DropColumn(
                name: "version",
                table: "test_case_steps");

            migrationBuilder.DropColumn(
                name: "version",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "version",
                table: "labels");

            migrationBuilder.DropColumn(
                name: "version",
                table: "email_subscriptions");

            migrationBuilder.AlterColumn<int>(
                name: "version",
                table: "test_runs",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);
        }
    }
}
