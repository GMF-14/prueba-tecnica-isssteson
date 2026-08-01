using Citas.Application.Comunes;
using Citas.Application.DTOs.Citas;
using Citas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Citas.Api.Controllers;

/// <summary>
/// Administración de citas: consulta, creación, edición y cancelación.
/// Todos los endpoints requieren un JWT válido.
/// </summary>
/// <remarks>
/// Reglas de negocio aplicadas por el servicio (no configurables desde el cliente):
/// el médico y el paciente deben existir y estar activos; la fecha no puede ser
/// anterior a hoy; toda cita dura exactamente 30 minutos; y no puede haber dos
/// citas del mismo médico con horarios que se traslapen.
/// </remarks>
[ApiController]
[Authorize]
[Route("api/citas")]
[Produces("application/json")]
public class CitasController : ControllerBase
{
    private readonly ICitaService _citaService;

    public CitasController(ICitaService citaService)
    {
        _citaService = citaService;
    }

    /// <summary>
    /// Consulta citas, con filtros opcionales.
    /// </summary>
    /// <param name="fechaDesde">Incluye citas a partir de esta fecha (inclusive).</param>
    /// <param name="fechaHasta">Incluye citas hasta esta fecha (inclusive, día completo).</param>
    /// <param name="medicoId">Filtra solo las citas de este médico.</param>
    /// <response code="200">Lista de citas que coinciden con los filtros (puede ser vacía).</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<CitaDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CitaDto>>> Consultar(
        [FromQuery] DateTime? fechaDesde,
        [FromQuery] DateTime? fechaHasta,
        [FromQuery] int? medicoId)
    {
        return Ok(await _citaService.ConsultarAsync(fechaDesde, fechaHasta, medicoId));
    }

    /// <summary>
    /// Obtiene una cita por su id.
    /// </summary>
    /// <response code="200">Cita encontrada.</response>
    /// <response code="404">No existe una cita con ese id.</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(CitaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CitaDto>> ObtenerPorId(int id)
    {
        var cita = await _citaService.ObtenerPorIdAsync(id);
        return cita is null ? NotFound() : Ok(cita);
    }

    /// <summary>
    /// Crea una cita nueva (queda en estado <c>Programada</c>).
    /// </summary>
    /// <response code="201">Cita creada.</response>
    /// <response code="400">
    /// Médico/paciente inexistente o inactivo, fecha anterior a hoy, o traslape de
    /// horario con otra cita del mismo médico.
    /// </response>
    [HttpPost]
    [ProducesResponseType(typeof(CitaDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CitaDto>> Crear(CrearCitaRequest request)
    {
        var resultado = await _citaService.CrearAsync(request);
        return resultado.Tipo == TipoResultado.Exito
            ? CreatedAtAction(nameof(ObtenerPorId), new { id = resultado.Valor!.Id }, resultado.Valor)
            : BadRequest(new { mensaje = resultado.Error });
    }

    /// <summary>
    /// Reprograma una cita existente (médico, paciente y/o horario).
    /// </summary>
    /// <response code="200">Cita actualizada.</response>
    /// <response code="400">
    /// La cita ya está cancelada, o los mismos motivos de validación que al crear
    /// (médico/paciente inválido, fecha pasada, traslape de horario).
    /// </response>
    /// <response code="404">No existe una cita con ese id.</response>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(CitaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CitaDto>> Actualizar(int id, ActualizarCitaRequest request)
    {
        var resultado = await _citaService.ActualizarAsync(id, request);
        return ResolverResultado(resultado);
    }

    /// <summary>
    /// Cancela una cita (cambia su estado a <c>Cancelada</c>; no la elimina).
    /// </summary>
    /// <response code="200">Cita cancelada.</response>
    /// <response code="400">La cita ya estaba cancelada.</response>
    /// <response code="404">No existe una cita con ese id.</response>
    [HttpPost("{id:int}/cancelar")]
    [ProducesResponseType(typeof(CitaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CitaDto>> Cancelar(int id)
    {
        var resultado = await _citaService.CancelarAsync(id);
        return ResolverResultado(resultado);
    }

    private ActionResult<CitaDto> ResolverResultado(ResultadoOperacion<CitaDto> resultado) => resultado.Tipo switch
    {
        TipoResultado.Exito => Ok(resultado.Valor),
        TipoResultado.NoEncontrado => NotFound(),
        _ => BadRequest(new { mensaje = resultado.Error })
    };
}
