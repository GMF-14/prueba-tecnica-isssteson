using System.ComponentModel.DataAnnotations;

namespace Citas.Application.DTOs.Citas;

public class ActualizarCitaRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un médico.")]
    public int MedicoId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un paciente.")]
    public int PacienteId { get; set; }

    [Required]
    public DateTime FechaHoraInicio { get; set; }
}
