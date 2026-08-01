using Citas.Application.DTOs.Pacientes;
using Citas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Citas.Api.Controllers;

/// <summary>
/// Catálogo de pacientes. Todos los endpoints requieren un JWT válido.
/// </summary>
[ApiController]
[Authorize]
[Route("api/pacientes")]
[Produces("application/json")]
public class PacientesController : ControllerBase
{
    private readonly IPacienteService _pacienteService;

    public PacientesController(IPacienteService pacienteService)
    {
        _pacienteService = pacienteService;
    }

    /// <summary>
    /// Lista los pacientes del catálogo.
    /// </summary>
    /// <param name="soloActivos">Si es <c>true</c>, excluye los pacientes dados de baja.</param>
    /// <response code="200">Lista de pacientes (puede ser vacía).</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<PacienteDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PacienteDto>>> ObtenerTodos([FromQuery] bool soloActivos = false)
    {
        return Ok(await _pacienteService.ObtenerTodosAsync(soloActivos));
    }

    /// <summary>
    /// Obtiene un paciente por su id.
    /// </summary>
    /// <response code="200">Paciente encontrado.</response>
    /// <response code="404">No existe un paciente con ese id.</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PacienteDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PacienteDto>> ObtenerPorId(int id)
    {
        var paciente = await _pacienteService.ObtenerPorIdAsync(id);
        return paciente is null ? NotFound() : Ok(paciente);
    }

    /// <summary>
    /// Crea un paciente.
    /// </summary>
    /// <response code="201">Paciente creado.</response>
    /// <response code="400">Datos inválidos (nombre faltante o correo con formato inválido).</response>
    [HttpPost]
    [ProducesResponseType(typeof(PacienteDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PacienteDto>> Crear(CrearPacienteRequest request)
    {
        var paciente = await _pacienteService.CrearAsync(request);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = paciente.Id }, paciente);
    }

    /// <summary>
    /// Actualiza los datos de un paciente (nombre, teléfono, correo y estado activo/inactivo).
    /// </summary>
    /// <response code="200">Paciente actualizado.</response>
    /// <response code="400">Datos inválidos.</response>
    /// <response code="404">No existe un paciente con ese id.</response>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(PacienteDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PacienteDto>> Actualizar(int id, ActualizarPacienteRequest request)
    {
        var paciente = await _pacienteService.ActualizarAsync(id, request);
        return paciente is null ? NotFound() : Ok(paciente);
    }

    /// <summary>
    /// Da de baja lógica a un paciente (<c>Activo = false</c>). No borra su historial de citas.
    /// </summary>
    /// <response code="204">Paciente desactivado.</response>
    /// <response code="404">No existe un paciente con ese id.</response>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Desactivar(int id)
    {
        var exito = await _pacienteService.DesactivarAsync(id);
        return exito ? NoContent() : NotFound();
    }
}
