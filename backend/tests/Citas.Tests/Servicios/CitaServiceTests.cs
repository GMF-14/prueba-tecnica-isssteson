using Citas.Application.Comunes;
using Citas.Application.DTOs.Citas;
using Citas.Domain.Entidades;
using Citas.Infrastructure.Persistencia;
using Citas.Infrastructure.Servicios;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Citas.Tests.Servicios;

public class CitaServiceTests
{
    private static CitasDbContext CrearContexto()
    {
        var opciones = new DbContextOptionsBuilder<CitasDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new CitasDbContext(opciones);
    }

    private static async Task<(Medico Medico, Paciente Paciente)> SembrarCatalogoAsync(CitasDbContext dbContext)
    {
        var medico = new Medico { NombreCompleto = "Dra. Ana Pérez", Especialidad = "Pediatría", Activo = true };
        var paciente = new Paciente { NombreCompleto = "Juan López", Telefono = "6621234567", Email = "juan@test.com", Activo = true };

        dbContext.Medicos.Add(medico);
        dbContext.Pacientes.Add(paciente);
        await dbContext.SaveChangesAsync();

        return (medico, paciente);
    }

    [Fact]
    public async Task CrearAsync_ConDatosValidos_CreaLaCitaProgramadaConDuracionDe30Minutos()
    {
        var dbContext = CrearContexto();
        var (medico, paciente) = await SembrarCatalogoAsync(dbContext);
        var servicio = new CitaService(dbContext);
        var inicio = DateTime.Today.AddDays(1).AddHours(10);

        var resultado = await servicio.CrearAsync(new CrearCitaRequest
        {
            MedicoId = medico.Id,
            PacienteId = paciente.Id,
            FechaHoraInicio = inicio
        });

        Assert.Equal(TipoResultado.Exito, resultado.Tipo);
        Assert.Equal("Programada", resultado.Valor!.Estado);
        Assert.Equal(inicio.AddMinutes(30), resultado.Valor.FechaHoraFin);
    }

    [Fact]
    public async Task CrearAsync_ConFechaAnteriorAHoy_DevuelveErrorDeValidacion()
    {
        var dbContext = CrearContexto();
        var (medico, paciente) = await SembrarCatalogoAsync(dbContext);
        var servicio = new CitaService(dbContext);

        var resultado = await servicio.CrearAsync(new CrearCitaRequest
        {
            MedicoId = medico.Id,
            PacienteId = paciente.Id,
            FechaHoraInicio = DateTime.Today.AddDays(-1).AddHours(10)
        });

        Assert.Equal(TipoResultado.ErrorValidacion, resultado.Tipo);
    }

    [Fact]
    public async Task CrearAsync_ConMedicoInactivo_DevuelveErrorDeValidacion()
    {
        var dbContext = CrearContexto();
        var (medico, paciente) = await SembrarCatalogoAsync(dbContext);
        medico.Activo = false;
        await dbContext.SaveChangesAsync();
        var servicio = new CitaService(dbContext);

        var resultado = await servicio.CrearAsync(new CrearCitaRequest
        {
            MedicoId = medico.Id,
            PacienteId = paciente.Id,
            FechaHoraInicio = DateTime.Today.AddDays(1).AddHours(10)
        });

        Assert.Equal(TipoResultado.ErrorValidacion, resultado.Tipo);
    }

    [Fact]
    public async Task CrearAsync_ConMedicoInexistente_DevuelveErrorDeValidacion()
    {
        var dbContext = CrearContexto();
        var (_, paciente) = await SembrarCatalogoAsync(dbContext);
        var servicio = new CitaService(dbContext);

        var resultado = await servicio.CrearAsync(new CrearCitaRequest
        {
            MedicoId = 9999,
            PacienteId = paciente.Id,
            FechaHoraInicio = DateTime.Today.AddDays(1).AddHours(10)
        });

        Assert.Equal(TipoResultado.ErrorValidacion, resultado.Tipo);
    }

    [Fact]
    public async Task CrearAsync_ConHorarioTraslapadoParaElMismoMedico_DevuelveErrorDeValidacion()
    {
        var dbContext = CrearContexto();
        var (medico, paciente) = await SembrarCatalogoAsync(dbContext);
        var servicio = new CitaService(dbContext);
        var inicio = DateTime.Today.AddDays(1).AddHours(10);

        await servicio.CrearAsync(new CrearCitaRequest { MedicoId = medico.Id, PacienteId = paciente.Id, FechaHoraInicio = inicio });

        // Empieza a las 10:15, dentro del rango [10:00, 10:30) de la cita ya creada.
        var resultado = await servicio.CrearAsync(new CrearCitaRequest
        {
            MedicoId = medico.Id,
            PacienteId = paciente.Id,
            FechaHoraInicio = inicio.AddMinutes(15)
        });

        Assert.Equal(TipoResultado.ErrorValidacion, resultado.Tipo);
    }

    [Fact]
    public async Task CrearAsync_ConHorarioConsecutivoSinTraslape_CreaLaCita()
    {
        var dbContext = CrearContexto();
        var (medico, paciente) = await SembrarCatalogoAsync(dbContext);
        var servicio = new CitaService(dbContext);
        var inicio = DateTime.Today.AddDays(1).AddHours(10);

        await servicio.CrearAsync(new CrearCitaRequest { MedicoId = medico.Id, PacienteId = paciente.Id, FechaHoraInicio = inicio });

        // Empieza justo cuando termina la anterior (10:30): no hay traslape.
        var resultado = await servicio.CrearAsync(new CrearCitaRequest
        {
            MedicoId = medico.Id,
            PacienteId = paciente.Id,
            FechaHoraInicio = inicio.AddMinutes(30)
        });

        Assert.Equal(TipoResultado.Exito, resultado.Tipo);
    }

    [Fact]
    public async Task CancelarAsync_ConCitaProgramada_LaMarcaComoCancelada()
    {
        var dbContext = CrearContexto();
        var (medico, paciente) = await SembrarCatalogoAsync(dbContext);
        var servicio = new CitaService(dbContext);

        var creada = await servicio.CrearAsync(new CrearCitaRequest
        {
            MedicoId = medico.Id,
            PacienteId = paciente.Id,
            FechaHoraInicio = DateTime.Today.AddDays(1).AddHours(10)
        });

        var resultado = await servicio.CancelarAsync(creada.Valor!.Id);

        Assert.Equal(TipoResultado.Exito, resultado.Tipo);
        Assert.Equal("Cancelada", resultado.Valor!.Estado);
    }

    [Fact]
    public async Task CancelarAsync_ConCitaYaCancelada_DevuelveErrorDeValidacion()
    {
        var dbContext = CrearContexto();
        var (medico, paciente) = await SembrarCatalogoAsync(dbContext);
        var servicio = new CitaService(dbContext);

        var creada = await servicio.CrearAsync(new CrearCitaRequest
        {
            MedicoId = medico.Id,
            PacienteId = paciente.Id,
            FechaHoraInicio = DateTime.Today.AddDays(1).AddHours(10)
        });
        await servicio.CancelarAsync(creada.Valor!.Id);

        var resultado = await servicio.CancelarAsync(creada.Valor!.Id);

        Assert.Equal(TipoResultado.ErrorValidacion, resultado.Tipo);
    }

    [Fact]
    public async Task CancelarAsync_ConIdInexistente_DevuelveNoEncontrado()
    {
        var dbContext = CrearContexto();
        var servicio = new CitaService(dbContext);

        var resultado = await servicio.CancelarAsync(9999);

        Assert.Equal(TipoResultado.NoEncontrado, resultado.Tipo);
    }

    [Fact]
    public async Task ActualizarAsync_SobreCitaCancelada_DevuelveErrorDeValidacion()
    {
        var dbContext = CrearContexto();
        var (medico, paciente) = await SembrarCatalogoAsync(dbContext);
        var servicio = new CitaService(dbContext);

        var creada = await servicio.CrearAsync(new CrearCitaRequest
        {
            MedicoId = medico.Id,
            PacienteId = paciente.Id,
            FechaHoraInicio = DateTime.Today.AddDays(1).AddHours(10)
        });
        await servicio.CancelarAsync(creada.Valor!.Id);

        var resultado = await servicio.ActualizarAsync(creada.Valor.Id, new ActualizarCitaRequest
        {
            MedicoId = medico.Id,
            PacienteId = paciente.Id,
            FechaHoraInicio = DateTime.Today.AddDays(2).AddHours(11)
        });

        Assert.Equal(TipoResultado.ErrorValidacion, resultado.Tipo);
    }

    [Fact]
    public async Task ActualizarAsync_ManteniendoElMismoHorario_NoSeConsideraTraslapeConsigoMisma()
    {
        var dbContext = CrearContexto();
        var (medico, paciente) = await SembrarCatalogoAsync(dbContext);
        var servicio = new CitaService(dbContext);
        var inicio = DateTime.Today.AddDays(1).AddHours(10);

        var creada = await servicio.CrearAsync(new CrearCitaRequest { MedicoId = medico.Id, PacienteId = paciente.Id, FechaHoraInicio = inicio });

        var resultado = await servicio.ActualizarAsync(creada.Valor!.Id, new ActualizarCitaRequest
        {
            MedicoId = medico.Id,
            PacienteId = paciente.Id,
            FechaHoraInicio = inicio
        });

        Assert.Equal(TipoResultado.Exito, resultado.Tipo);
    }
}
