namespace Citas.Domain.Entidades;

public class Usuario
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;

    // Nunca se guarda la contraseña en texto plano, solo su hash (BCrypt).
    public string PasswordHash { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}
