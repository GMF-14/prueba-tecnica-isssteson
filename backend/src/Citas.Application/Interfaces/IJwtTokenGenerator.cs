using Citas.Domain.Entidades;

namespace Citas.Application.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiraEn) GenerarToken(Usuario usuario);
}
