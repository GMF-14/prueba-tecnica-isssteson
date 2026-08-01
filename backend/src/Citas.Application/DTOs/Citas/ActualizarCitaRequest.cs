using System.ComponentModel.DataAnnotations;

namespace Citas.Application.DTOs.Citas;

public class ActualizarCitaRequest
{
    /// <summary>Id de un médico existente y activo.</summary>
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un médico.")]
    public int MedicoId { get; set; }

    /// <summary>Id de un paciente existente y activo.</summary>
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un paciente.")]
    public int PacienteId { get; set; }

    /// <summary>Nueva fecha y hora de inicio (no puede ser anterior a hoy).</summary>
    [Required]
    public DateTime FechaHoraInicio { get; set; }
}
