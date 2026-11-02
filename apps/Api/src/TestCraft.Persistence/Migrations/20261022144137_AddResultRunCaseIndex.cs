using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddResultRunCaseIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_test_results_test_run_id_test_case_id",
                table: "test_results",
                columns: new[] { "test_run_id", "test_case_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_test_results_test_run_id_test_case_id",
                table: "test_results");
        }
    }
}
