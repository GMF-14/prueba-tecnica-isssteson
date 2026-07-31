using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Citas.Infrastructure.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class SeedUsuarioAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "Activo", "Nombre", "NombreUsuario", "PasswordHash" },
                values: new object[] { 1, true, "Administrador", "admin", "$2a$11$oX8FybCxSeGMeAtWOuctxOZNJu1ckCuWEcBiy0fz5Ll/vZ8VPfC6q" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1);
        }
    }
}
