namespace Citas.Application.DTOs.Auth;

public class LoginResponse
{
    /// <summary>Token JWT. Se envía en las siguientes peticiones como <c>Authorization: Bearer &lt;token&gt;</c>.</summary>
    public string Token { get; set; } = string.Empty;

    public string NombreUsuario { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;

    /// <summary>Fecha y hora (UTC) en que expira el token.</summary>
    public DateTime ExpiraEn { get; set; }
}
