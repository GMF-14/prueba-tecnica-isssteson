namespace Citas.Application.DTOs.Citas;

public class CitaDto
{
    public int Id { get; set; }

    public int MedicoId { get; set; }
    public string MedicoNombre { get; set; } = string.Empty;

    public int PacienteId { get; set; }
    public string PacienteNombre { get; set; } = string.Empty;

    public DateTime FechaHoraInicio { get; set; }
    public DateTime FechaHoraFin { get; set; }

    public string Estado { get; set; } = string.Empty;
}
