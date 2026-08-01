namespace Citas.Application.DTOs.Auth;

public class LoginRequest
{
    /// <summary>Nombre de usuario. Usuario semilla: <c>admin</c>.</summary>
    public string NombreUsuario { get; set; } = string.Empty;

    /// <summary>Contraseña en texto plano (se valida contra el hash BCrypt guardado).</summary>
    public string Password { get; set; } = string.Empty;
}
