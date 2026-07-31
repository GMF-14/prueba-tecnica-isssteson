using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Citas.Infrastructure.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class SeedMedicosYPacientes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Medicos",
                columns: new[] { "Id", "Activo", "Especialidad", "NombreCompleto" },
                values: new object[,]
                {
                    { 1, true, "Pediatría", "Dra. Ana Pérez" },
                    { 2, true, "Cardiología", "Dr. Carlos Ramírez" },
                    { 3, true, "Dermatología", "Dra. Lucía Fernández" },
                    { 4, true, "Traumatología", "Dr. Miguel Torres" },
                    { 5, true, "Ginecología", "Dra. Sofía Gómez" }
                });

            migrationBuilder.InsertData(
                table: "Pacientes",
                columns: new[] { "Id", "Activo", "Email", "NombreCompleto", "Telefono" },
                values: new object[,]
                {
                    { 1, true, "juan.lopez@correo.com", "Juan López", "6621234567" },
                    { 2, true, "maria.hernandez@correo.com", "María Hernández", "6627654321" },
                    { 3, true, "pedro.sanchez@correo.com", "Pedro Sánchez", "6621112233" },
                    { 4, true, "laura.martinez@correo.com", "Laura Martínez", "6624445566" },
                    { 5, true, "roberto.diaz@correo.com", "Roberto Díaz", "6627778899" },
                    { 6, true, "carmen.ruiz@correo.com", "Carmen Ruiz", "6620001122" },
                    { 7, true, "fernando.castro@correo.com", "Fernando Castro", "6623334455" },
                    { 8, true, "patricia.morales@correo.com", "Patricia Morales", "6626667788" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Medicos",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Medicos",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Medicos",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Medicos",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Medicos",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Pacientes",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Pacientes",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Pacientes",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Pacientes",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Pacientes",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Pacientes",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Pacientes",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Pacientes",
                keyColumn: "Id",
                keyValue: 8);
        }
    }
}
