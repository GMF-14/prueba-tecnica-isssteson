using Citas.Application.DTOs.Medicos;

namespace Citas.Application.Interfaces;

public interface IMedicoService
{
    Task<List<MedicoDto>> ObtenerTodosAsync(bool soloActivos);
    Task<MedicoDto?> ObtenerPorIdAsync(int id);
    Task<MedicoDto> CrearAsync(CrearMedicoRequest request);
    Task<MedicoDto?> ActualizarAsync(int id, ActualizarMedicoRequest request);
    Task<bool> DesactivarAsync(int id);
}
