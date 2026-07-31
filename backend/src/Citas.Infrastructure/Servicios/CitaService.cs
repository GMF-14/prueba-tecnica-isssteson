using Citas.Application.Comunes;
using Citas.Application.DTOs.Citas;
using Citas.Application.Interfaces;
using Citas.Domain.Entidades;
using Citas.Domain.Enums;
using Citas.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;

namespace Citas.Infrastructure.Servicios;

public class CitaService : ICitaService
{
    private readonly CitasDbContext _dbContext;

    public CitaService(CitasDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CitaDto>> ConsultarAsync(DateTime? fechaDesde, DateTime? fechaHasta, int? medicoId)
    {
        var query = ConNavegaciones().AsQueryable();

        if (fechaDesde.HasValue)
        {
            query = query.Where(c => c.FechaHoraInicio >= fechaDesde.Value.Date);
        }

        if (fechaHasta.HasValue)
        {
            // Incluye todo el día de "hasta" (hasta las 23:59:59.999...).
            var finDelDia = fechaHasta.Value.Date.AddDays(1);
            query = query.Where(c => c.FechaHoraInicio < finDelDia);
        }

        if (medicoId.HasValue)
        {
            query = query.Where(c => c.MedicoId == medicoId.Value);
        }

        var citas = await query.OrderBy(c => c.FechaHoraInicio).ToListAsync();

        // El mapeo a DTO (incluye Estado.ToString()) se hace en memoria, no en SQL.
        return citas.Select(MapearADto).ToList();
    }

    public async Task<CitaDto?> ObtenerPorIdAsync(int id)
    {
        var cita = await ConNavegaciones().FirstOrDefaultAsync(c => c.Id == id);
        return cita is null ? null : MapearADto(cita);
    }

    public async Task<ResultadoOperacion<CitaDto>> CrearAsync(CrearCitaRequest request)
    {
        var errorValidacion = await ValidarMedicoYPacienteAsync(request.MedicoId, request.PacienteId);
        if (errorValidacion is not null)
        {
            return ResultadoOperacion<CitaDto>.Invalido(errorValidacion);
        }

        var errorFecha = ValidarFecha(request.FechaHoraInicio);
        if (errorFecha is not null)
        {
            return ResultadoOperacion<CitaDto>.Invalido(errorFecha);
        }

        var fechaHoraFin = request.FechaHoraInicio.AddMinutes(Cita.DuracionMinutos);

        if (await ExisteTraslapeAsync(request.MedicoId, request.FechaHoraInicio, fechaHoraFin, idExcluir: null))
        {
            return ResultadoOperacion<CitaDto>.Invalido("El médico ya tiene una cita programada en ese horario.");
        }

        var cita = new Cita
        {
            MedicoId = request.MedicoId,
            PacienteId = request.PacienteId,
            FechaHoraInicio = request.FechaHoraInicio,
            FechaHoraFin = fechaHoraFin,
            Estado = EstadoCita.Programada
        };

        _dbContext.Citas.Add(cita);
        await _dbContext.SaveChangesAsync();

        return ResultadoOperacion<CitaDto>.Exito((await ObtenerPorIdAsync(cita.Id))!);
    }

    public async Task<ResultadoOperacion<CitaDto>> ActualizarAsync(int id, ActualizarCitaRequest request)
    {
        var cita = await _dbContext.Citas.FirstOrDefaultAsync(c => c.Id == id);
        if (cita is null)
        {
            return ResultadoOperacion<CitaDto>.NoEncontrado();
        }

        if (cita.Estado == EstadoCita.Cancelada)
        {
            return ResultadoOperacion<CitaDto>.Invalido("No se puede editar una cita cancelada.");
        }

        var errorValidacion = await ValidarMedicoYPacienteAsync(request.MedicoId, request.PacienteId);
        if (errorValidacion is not null)
        {
            return ResultadoOperacion<CitaDto>.Invalido(errorValidacion);
        }

        var errorFecha = ValidarFecha(request.FechaHoraInicio);
        if (errorFecha is not null)
        {
            return ResultadoOperacion<CitaDto>.Invalido(errorFecha);
        }

        var fechaHoraFin = request.FechaHoraInicio.AddMinutes(Cita.DuracionMinutos);

        if (await ExisteTraslapeAsync(request.MedicoId, request.FechaHoraInicio, fechaHoraFin, idExcluir: id))
        {
            return ResultadoOperacion<CitaDto>.Invalido("El médico ya tiene una cita programada en ese horario.");
        }

        cita.MedicoId = request.MedicoId;
        cita.PacienteId = request.PacienteId;
        cita.FechaHoraInicio = request.FechaHoraInicio;
        cita.FechaHoraFin = fechaHoraFin;

        await _dbContext.SaveChangesAsync();

        return ResultadoOperacion<CitaDto>.Exito((await ObtenerPorIdAsync(id))!);
    }

    public async Task<ResultadoOperacion<CitaDto>> CancelarAsync(int id)
    {
        var cita = await _dbContext.Citas.FirstOrDefaultAsync(c => c.Id == id);
        if (cita is null)
        {
            return ResultadoOperacion<CitaDto>.NoEncontrado();
        }

        if (cita.Estado == EstadoCita.Cancelada)
        {
            return ResultadoOperacion<CitaDto>.Invalido("La cita ya está cancelada.");
        }

        cita.Estado = EstadoCita.Cancelada;
        await _dbContext.SaveChangesAsync();

        return ResultadoOperacion<CitaDto>.Exito((await ObtenerPorIdAsync(id))!);
    }

    private IQueryable<Cita> ConNavegaciones() =>
        _dbContext.Citas.AsNoTracking().Include(c => c.Medico).Include(c => c.Paciente);

    private async Task<string?> ValidarMedicoYPacienteAsync(int medicoId, int pacienteId)
    {
        var medico = await _dbContext.Medicos.AsNoTracking().FirstOrDefaultAsync(m => m.Id == medicoId);
        if (medico is null || !medico.Activo)
        {
            return "El médico seleccionado no existe o no está activo.";
        }

        var paciente = await _dbContext.Pacientes.AsNoTracking().FirstOrDefaultAsync(p => p.Id == pacienteId);
        if (paciente is null || !paciente.Activo)
        {
            return "El paciente seleccionado no existe o no está activo.";
        }

        return null;
    }

    private static string? ValidarFecha(DateTime fechaHoraInicio)
    {
        // El requisito pide validar el día, no la hora exacta: se permite agendar
        // "hoy" aunque la hora ya haya pasado.
        return fechaHoraInicio.Date < DateTime.Now.Date
            ? "La fecha de la cita no puede ser anterior al día de hoy."
            : null;
    }

    private async Task<bool> ExisteTraslapeAsync(int medicoId, DateTime inicio, DateTime fin, int? idExcluir)
    {
        return await _dbContext.Citas.AnyAsync(c =>
            c.MedicoId == medicoId &&
            c.Estado == EstadoCita.Programada &&
            (idExcluir == null || c.Id != idExcluir) &&
            c.FechaHoraInicio < fin &&
            inicio < c.FechaHoraFin);
    }

    private static CitaDto MapearADto(Cita c) => new()
    {
        Id = c.Id,
        MedicoId = c.MedicoId,
        MedicoNombre = c.Medico!.NombreCompleto,
        PacienteId = c.PacienteId,
        PacienteNombre = c.Paciente!.NombreCompleto,
        FechaHoraInicio = c.FechaHoraInicio,
        FechaHoraFin = c.FechaHoraFin,
        Estado = c.Estado.ToString()
    };
}
