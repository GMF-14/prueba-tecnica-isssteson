namespace Citas.Domain.Entidades;

public class Medico
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Especialidad { get; set; } = string.Empty;

    // Permite "dar de baja" un médico sin borrar su historial de citas.
    public bool Activo { get; set; } = true;

    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
