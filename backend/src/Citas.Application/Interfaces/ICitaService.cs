using Citas.Application.Comunes;
using Citas.Application.DTOs.Citas;

namespace Citas.Application.Interfaces;

public interface ICitaService
{
    Task<List<CitaDto>> ConsultarAsync(DateTime? fechaDesde, DateTime? fechaHasta, int? medicoId);
    Task<CitaDto?> ObtenerPorIdAsync(int id);
    Task<ResultadoOperacion<CitaDto>> CrearAsync(CrearCitaRequest request);
    Task<ResultadoOperacion<CitaDto>> ActualizarAsync(int id, ActualizarCitaRequest request);
    Task<ResultadoOperacion<CitaDto>> CancelarAsync(int id);
}
