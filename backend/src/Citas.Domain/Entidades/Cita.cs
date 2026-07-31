using Citas.Domain.Enums;

namespace Citas.Domain.Entidades;

public class Cita
{
    // Regla de negocio: toda cita dura exactamente 30 minutos.
    public const int DuracionMinutos = 30;

    public int Id { get; set; }

    public int MedicoId { get; set; }
    public Medico? Medico { get; set; }

    public int PacienteId { get; set; }
    public Paciente? Paciente { get; set; }

    public DateTime FechaHoraInicio { get; set; }
    public DateTime FechaHoraFin { get; set; }

    public EstadoCita Estado { get; set; } = EstadoCita.Programada;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
