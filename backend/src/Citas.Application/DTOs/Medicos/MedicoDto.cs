namespace Citas.Application.DTOs.Medicos;

public class MedicoDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Especialidad { get; set; } = string.Empty;
    public bool Activo { get; set; }
}
