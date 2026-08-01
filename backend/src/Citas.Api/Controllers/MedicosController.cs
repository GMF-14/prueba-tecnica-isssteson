using Citas.Application.DTOs.Medicos;
using Citas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Citas.Api.Controllers;

/// <summary>
/// Catálogo de médicos. Todos los endpoints requieren un JWT válido.
/// </summary>
[ApiController]
[Authorize]
[Route("api/medicos")]
[Produces("application/json")]
public class MedicosController : ControllerBase
{
    private readonly IMedicoService _medicoService;

    public MedicosController(IMedicoService medicoService)
    {
        _medicoService = medicoService;
    }

    /// <summary>
    /// Lista los médicos del catálogo.
    /// </summary>
    /// <param name="soloActivos">Si es <c>true</c>, excluye los médicos dados de baja.</param>
    /// <response code="200">Lista de médicos (puede ser vacía).</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<MedicoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MedicoDto>>> ObtenerTodos([FromQuery] bool soloActivos = false)
    {
        return Ok(await _medicoService.ObtenerTodosAsync(soloActivos));
    }

    /// <summary>
    /// Obtiene un médico por su id.
    /// </summary>
    /// <response code="200">Médico encontrado.</response>
    /// <response code="404">No existe un médico con ese id.</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(MedicoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MedicoDto>> ObtenerPorId(int id)
    {
        var medico = await _medicoService.ObtenerPorIdAsync(id);
        return medico is null ? NotFound() : Ok(medico);
    }

    /// <summary>
    /// Crea un médico.
    /// </summary>
    /// <response code="201">Médico creado.</response>
    /// <response code="400">Datos inválidos (nombre/especialidad faltantes).</response>
    [HttpPost]
    [ProducesResponseType(typeof(MedicoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MedicoDto>> Crear(CrearMedicoRequest request)
    {
        var medico = await _medicoService.CrearAsync(request);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = medico.Id }, medico);
    }

    /// <summary>
    /// Actualiza los datos de un médico (nombre, especialidad y estado activo/inactivo).
    /// </summary>
    /// <response code="200">Médico actualizado.</response>
    /// <response code="400">Datos inválidos.</response>
    /// <response code="404">No existe un médico con ese id.</response>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(MedicoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MedicoDto>> Actualizar(int id, ActualizarMedicoRequest request)
    {
        var medico = await _medicoService.ActualizarAsync(id, request);
        return medico is null ? NotFound() : Ok(medico);
    }

    /// <summary>
    /// Da de baja lógica a un médico (<c>Activo = false</c>). No borra su historial de citas.
    /// </summary>
    /// <response code="204">Médico desactivado.</response>
    /// <response code="404">No existe un médico con ese id.</response>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Desactivar(int id)
    {
        var exito = await _medicoService.DesactivarAsync(id);
        return exito ? NoContent() : NotFound();
    }
}
