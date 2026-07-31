using Citas.Application.DTOs.Pacientes;
using Citas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Citas.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/pacientes")]
public class PacientesController : ControllerBase
{
    private readonly IPacienteService _pacienteService;

    public PacientesController(IPacienteService pacienteService)
    {
        _pacienteService = pacienteService;
    }

    [HttpGet]
    public async Task<ActionResult<List<PacienteDto>>> ObtenerTodos([FromQuery] bool soloActivos = false)
    {
        return Ok(await _pacienteService.ObtenerTodosAsync(soloActivos));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PacienteDto>> ObtenerPorId(int id)
    {
        var paciente = await _pacienteService.ObtenerPorIdAsync(id);
        return paciente is null ? NotFound() : Ok(paciente);
    }

    [HttpPost]
    public async Task<ActionResult<PacienteDto>> Crear(CrearPacienteRequest request)
    {
        var paciente = await _pacienteService.CrearAsync(request);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = paciente.Id }, paciente);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PacienteDto>> Actualizar(int id, ActualizarPacienteRequest request)
    {
        var paciente = await _pacienteService.ActualizarAsync(id, request);
        return paciente is null ? NotFound() : Ok(paciente);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var exito = await _pacienteService.DesactivarAsync(id);
        return exito ? NoContent() : NotFound();
    }
}
