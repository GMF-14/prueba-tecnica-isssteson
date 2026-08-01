using System.ComponentModel.DataAnnotations;

namespace Citas.Application.DTOs.Medicos;

public class ActualizarMedicoRequest
{
    /// <summary>Nombre completo del médico.</summary>
    [Required, MaxLength(200)]
    public string NombreCompleto { get; set; } = string.Empty;

    /// <summary>Especialidad médica (ej. "Pediatría").</summary>
    [Required, MaxLength(150)]
    public string Especialidad { get; set; } = string.Empty;

    /// <summary>En <c>false</c> equivale a dar de baja al médico (mismo efecto que DELETE).</summary>
    public bool Activo { get; set; }
}
