using Citas.Application.DTOs.Medicos;
using Citas.Application.Interfaces;
using Citas.Domain.Entidades;
using Citas.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;

namespace Citas.Infrastructure.Servicios;

public class MedicoService : IMedicoService
{
    private readonly CitasDbContext _dbContext;

    public MedicoService(CitasDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<MedicoDto>> ObtenerTodosAsync(bool soloActivos)
    {
        var query = _dbContext.Medicos.AsNoTracking().AsQueryable();

        if (soloActivos)
        {
            query = query.Where(m => m.Activo);
        }

        return await query
            .OrderBy(m => m.NombreCompleto)
            .Select(m => new MedicoDto
            {
                Id = m.Id,
                NombreCompleto = m.NombreCompleto,
                Especialidad = m.Especialidad,
                Activo = m.Activo
            })
            .ToListAsync();
    }

    public async Task<MedicoDto?> ObtenerPorIdAsync(int id)
    {
        var medico = await _dbContext.Medicos.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
        return medico is null ? null : MapearADto(medico);
    }

    public async Task<MedicoDto> CrearAsync(CrearMedicoRequest request)
    {
        var medico = new Medico
        {
            NombreCompleto = request.NombreCompleto,
            Especialidad = request.Especialidad,
            Activo = true
        };

        _dbContext.Medicos.Add(medico);
        await _dbContext.SaveChangesAsync();

        return MapearADto(medico);
    }

    public async Task<MedicoDto?> ActualizarAsync(int id, ActualizarMedicoRequest request)
    {
        var medico = await _dbContext.Medicos.FirstOrDefaultAsync(m => m.Id == id);
        if (medico is null)
        {
            return null;
        }

        medico.NombreCompleto = request.NombreCompleto;
        medico.Especialidad = request.Especialidad;
        medico.Activo = request.Activo;

        await _dbContext.SaveChangesAsync();

        return MapearADto(medico);
    }

    public async Task<bool> DesactivarAsync(int id)
    {
        var medico = await _dbContext.Medicos.FirstOrDefaultAsync(m => m.Id == id);
        if (medico is null)
        {
            return false;
        }

        // Baja lógica: conserva el historial de citas ya asociadas a este médico.
        medico.Activo = false;
        await _dbContext.SaveChangesAsync();

        return true;
    }

    private static MedicoDto MapearADto(Medico medico) => new()
    {
        Id = medico.Id,
        NombreCompleto = medico.NombreCompleto,
        Especialidad = medico.Especialidad,
        Activo = medico.Activo
    };
}
