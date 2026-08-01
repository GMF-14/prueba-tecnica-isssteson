using System.ComponentModel.DataAnnotations;

namespace Citas.Application.DTOs.Pacientes;

public class ActualizarPacienteRequest
{
    /// <summary>Nombre completo del paciente.</summary>
    [Required, MaxLength(200)]
    public string NombreCompleto { get; set; } = string.Empty;

    /// <summary>Teléfono de contacto (opcional).</summary>
    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    /// <summary>Correo electrónico de contacto (opcional).</summary>
    [MaxLength(200), EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>En <c>false</c> equivale a dar de baja al paciente (mismo efecto que DELETE).</summary>
    public bool Activo { get; set; }
}
