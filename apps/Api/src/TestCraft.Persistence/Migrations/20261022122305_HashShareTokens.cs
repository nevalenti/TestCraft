using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestCraft.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HashShareTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "token_hash",
                table: "share_tokens",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE share_tokens SET token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex')"
            );

            migrationBuilder.AlterColumn<string>(
                name: "token_hash",
                table: "share_tokens",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.DropIndex(
                name: "IX_share_tokens_token",
                table: "share_tokens");

            migrationBuilder.DropColumn(
                name: "token",
                table: "share_tokens");

            migrationBuilder.CreateIndex(
                name: "IX_share_tokens_token_hash",
                table: "share_tokens",
                column: "token_hash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException("Share token hashes cannot be reversed");
        }
    }
}
