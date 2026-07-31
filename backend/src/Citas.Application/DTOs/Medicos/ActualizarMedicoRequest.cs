using System.ComponentModel.DataAnnotations;

namespace Citas.Application.DTOs.Medicos;

public class ActualizarMedicoRequest
{
    [Required, MaxLength(200)]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Especialidad { get; set; } = string.Empty;

    public bool Activo { get; set; }
}
