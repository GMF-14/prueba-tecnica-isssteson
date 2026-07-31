using Citas.Application.DTOs.Auth;
using Citas.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Citas.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
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
