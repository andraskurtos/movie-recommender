using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class DetailsAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Director",
                table: "Movies",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProductionCompany",
                table: "Movies",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Runtime",
                table: "Movies",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Tagline",
                table: "Movies",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "VoteAverage",
                table: "Movies",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Director",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "ProductionCompany",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "Runtime",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "Tagline",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "VoteAverage",
                table: "Movies");
        }
    }
}
