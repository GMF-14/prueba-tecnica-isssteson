using Citas.Application.Comunes;
using Citas.Application.DTOs.Citas;
using Citas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Citas.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/citas")]
public class CitasController : ControllerBase
{
    private readonly ICitaService _citaService;

    public CitasController(ICitaService citaService)
    {
        _citaService = citaService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CitaDto>>> Consultar(
        [FromQuery] DateTime? fechaDesde,
        [FromQuery] DateTime? fechaHasta,
        [FromQuery] int? medicoId)
    {
        return Ok(await _citaService.ConsultarAsync(fechaDesde, fechaHasta, medicoId));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CitaDto>> ObtenerPorId(int id)
    {
        var cita = await _citaService.ObtenerPorIdAsync(id);
        return cita is null ? NotFound() : Ok(cita);
    }

    [HttpPost]
    public async Task<ActionResult<CitaDto>> Crear(CrearCitaRequest request)
    {
        var resultado = await _citaService.CrearAsync(request);
        return resultado.Tipo == TipoResultado.Exito
            ? CreatedAtAction(nameof(ObtenerPorId), new { id = resultado.Valor!.Id }, resultado.Valor)
            : BadRequest(new { mensaje = resultado.Error });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CitaDto>> Actualizar(int id, ActualizarCitaRequest request)
    {
        var resultado = await _citaService.ActualizarAsync(id, request);
        return ResolverResultado(resultado);
    }

    [HttpPost("{id:int}/cancelar")]
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
