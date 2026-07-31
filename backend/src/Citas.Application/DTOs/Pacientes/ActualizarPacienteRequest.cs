using System.ComponentModel.DataAnnotations;

namespace Citas.Application.DTOs.Pacientes;

public class ActualizarPacienteRequest
{
    [Required, MaxLength(200)]
    public string NombreCompleto { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    [MaxLength(200), EmailAddress]
    public string Email { get; set; } = string.Empty;

    public bool Activo { get; set; }
}
