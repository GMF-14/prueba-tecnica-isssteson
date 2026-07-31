using Citas.Application.DTOs.Auth;

namespace Citas.Application.Interfaces;

public interface IAuthService
{
    // Devuelve null cuando el usuario no existe, está inactivo o la contraseña no coincide.
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}
