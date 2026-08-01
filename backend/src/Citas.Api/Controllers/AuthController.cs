using Citas.Application.DTOs.Auth;
using Citas.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Citas.Api.Controllers;

/// <summary>
/// Autenticación de usuarios del sistema.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Inicia sesión y devuelve un token JWT.
    /// </summary>
    /// <remarks>
    /// El token debe enviarse en las siguientes peticiones como
    /// <c>Authorization: Bearer &lt;token&gt;</c>. Expira según <c>Jwt:ExpiracionMinutos</c>
    /// (60 minutos por defecto).
    /// </remarks>
    /// <param name="request">Usuario y contraseña.</param>
    /// <response code="200">Login exitoso: devuelve el token y los datos del usuario.</response>
    /// <response code="401">Usuario o contraseña incorrectos, o usuario inactivo.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var respuesta = await _authService.LoginAsync(request);

        if (respuesta is null)
        {
            return Unauthorized(new { mensaje = "Usuario o contraseña incorrectos." });
        }

        return Ok(respuesta);
    }
}
