using Citas.Application.DTOs.Pacientes;
using Citas.Application.Interfaces;
using Citas.Domain.Entidades;
using Citas.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;

namespace Citas.Infrastructure.Servicios;

public class PacienteService : IPacienteService
{
    private readonly CitasDbContext _dbContext;

    public PacienteService(CitasDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<PacienteDto>> ObtenerTodosAsync(bool soloActivos)
    {
        var query = _dbContext.Pacientes.AsNoTracking().AsQueryable();

        if (soloActivos)
        {
            query = query.Where(p => p.Activo);
        }

        return await query
            .OrderBy(p => p.NombreCompleto)
            .Select(p => new PacienteDto
            {
                Id = p.Id,
                NombreCompleto = p.NombreCompleto,
                Telefono = p.Telefono,
                Email = p.Email,
                Activo = p.Activo
            })
            .ToListAsync();
    }

    public async Task<PacienteDto?> ObtenerPorIdAsync(int id)
    {
        var paciente = await _dbContext.Pacientes.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        return paciente is null ? null : MapearADto(paciente);
    }

    public async Task<PacienteDto> CrearAsync(CrearPacienteRequest request)
    {
        var paciente = new Paciente
        {
            NombreCompleto = request.NombreCompleto,
            Telefono = request.Telefono,
            Email = request.Email,
            Activo = true
        };

        _dbContext.Pacientes.Add(paciente);
        await _dbContext.SaveChangesAsync();

        return MapearADto(paciente);
    }

    public async Task<PacienteDto?> ActualizarAsync(int id, ActualizarPacienteRequest request)
    {
        var paciente = await _dbContext.Pacientes.FirstOrDefaultAsync(p => p.Id == id);
        if (paciente is null)
        {
            return null;
        }

        paciente.NombreCompleto = request.NombreCompleto;
        paciente.Telefono = request.Telefono;
        paciente.Email = request.Email;
        paciente.Activo = request.Activo;

        await _dbContext.SaveChangesAsync();

        return MapearADto(paciente);
    }

    public async Task<bool> DesactivarAsync(int id)
    {
        var paciente = await _dbContext.Pacientes.FirstOrDefaultAsync(p => p.Id == id);
        if (paciente is null)
        {
            return false;
        }

        // Baja lógica: conserva el historial de citas ya asociadas a este paciente.
        paciente.Activo = false;
        await _dbContext.SaveChangesAsync();

        return true;
    }

    private static PacienteDto MapearADto(Paciente paciente) => new()
    {
        Id = paciente.Id,
        NombreCompleto = paciente.NombreCompleto,
        Telefono = paciente.Telefono,
        Email = paciente.Email,
        Activo = paciente.Activo
    };
}
