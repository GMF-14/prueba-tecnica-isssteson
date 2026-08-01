using System.ComponentModel.DataAnnotations;

namespace Citas.Application.DTOs.Citas;

public class CrearCitaRequest
{
    /// <summary>Id de un médico existente y activo.</summary>
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un médico.")]
    public int MedicoId { get; set; }

    /// <summary>Id de un paciente existente y activo.</summary>
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un paciente.")]
    public int PacienteId { get; set; }

    /// <summary>Fecha y hora de inicio (no puede ser anterior a hoy). La duración (30 min) la calcula el servidor.</summary>
    [Required]
    public DateTime FechaHoraInicio { get; set; }
}
