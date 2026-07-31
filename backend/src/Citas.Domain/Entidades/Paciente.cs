namespace Citas.Domain.Entidades;

public class Paciente
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // Permite "dar de baja" un paciente sin borrar su historial de citas.
    public bool Activo { get; set; } = true;

    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
}
