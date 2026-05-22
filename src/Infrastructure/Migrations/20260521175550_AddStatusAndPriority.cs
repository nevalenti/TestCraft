using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusAndPriority : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "TestRuns",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Active");

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "TestCases",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Medium");

            migrationBuilder.CreateIndex(
                name: "IX_TestRuns_Status",
                table: "TestRuns",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TestResults_ExecutedAt",
                table: "TestResults",
                column: "ExecutedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TestResults_Status",
                table: "TestResults",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TestCases_Priority",
                table: "TestCases",
                column: "Priority");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TestRuns_Status",
                table: "TestRuns");

            migrationBuilder.DropIndex(
                name: "IX_TestResults_ExecutedAt",
                table: "TestResults");

            migrationBuilder.DropIndex(
                name: "IX_TestResults_Status",
                table: "TestResults");

            migrationBuilder.DropIndex(
                name: "IX_TestCases_Priority",
                table: "TestCases");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "TestRuns");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "TestCases");
        }
    }
}