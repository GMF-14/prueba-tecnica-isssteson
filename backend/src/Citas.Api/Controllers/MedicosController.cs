using Citas.Application.DTOs.Medicos;
using Citas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Citas.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/medicos")]
public class MedicosController : ControllerBase
{
    private readonly IMedicoService _medicoService;

    public MedicosController(IMedicoService medicoService)
    {
        _medicoService = medicoService;
    }

    [HttpGet]
    public async Task<ActionResult<List<MedicoDto>>> ObtenerTodos([FromQuery] bool soloActivos = false)
    {
        return Ok(await _medicoService.ObtenerTodosAsync(soloActivos));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MedicoDto>> ObtenerPorId(int id)
    {
        var medico = await _medicoService.ObtenerPorIdAsync(id);
        return medico is null ? NotFound() : Ok(medico);
    }

    [HttpPost]
    public async Task<ActionResult<MedicoDto>> Crear(CrearMedicoRequest request)
    {
        var medico = await _medicoService.CrearAsync(request);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = medico.Id }, medico);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<MedicoDto>> Actualizar(int id, ActualizarMedicoRequest request)
    {
        var medico = await _medicoService.ActualizarAsync(id, request);
        return medico is null ? NotFound() : Ok(medico);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Desactivar(int id)
    {
        var exito = await _medicoService.DesactivarAsync(id);
        return exito ? NoContent() : NotFound();
    }
}
