using Citas.Application.DTOs.Pacientes;

namespace Citas.Application.Interfaces;

public interface IPacienteService
{
    Task<List<PacienteDto>> ObtenerTodosAsync(bool soloActivos);
    Task<PacienteDto?> ObtenerPorIdAsync(int id);
    Task<PacienteDto> CrearAsync(CrearPacienteRequest request);
    Task<PacienteDto?> ActualizarAsync(int id, ActualizarPacienteRequest request);
    Task<bool> DesactivarAsync(int id);
}
