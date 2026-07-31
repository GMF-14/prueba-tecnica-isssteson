using Citas.Application.DTOs.Auth;
using Citas.Application.Interfaces;
using Citas.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;

namespace Citas.Infrastructure.Seguridad;

public class AuthService : IAuthService
{
    private readonly CitasDbContext _dbContext;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(CitasDbContext dbContext, IJwtTokenGenerator jwtTokenGenerator)
    {
        _dbContext = dbContext;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var usuario = await _dbContext.Usuarios
            .FirstOrDefaultAsync(u => u.NombreUsuario == request.NombreUsuario && u.Activo);

        if (usuario is null || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
        {
            return null;
        }

        var (token, expiraEn) = _jwtTokenGenerator.GenerarToken(usuario);

        return new LoginResponse
        {
            Token = token,
            NombreUsuario = usuario.NombreUsuario,
            Nombre = usuario.Nombre,
            ExpiraEn = expiraEn
        };
    }
}
