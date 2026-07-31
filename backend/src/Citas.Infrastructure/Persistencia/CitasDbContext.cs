using Citas.Domain.Entidades;
using Microsoft.EntityFrameworkCore;

namespace Citas.Infrastructure.Persistencia;

public class CitasDbContext : DbContext
{
    public CitasDbContext(DbContextOptions<CitasDbContext> options) : base(options)
    {
    }

    public DbSet<Medico> Medicos => Set<Medico>();
    public DbSet<Paciente> Pacientes => Set<Paciente>();
    public DbSet<Cita> Citas => Set<Cita>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Medico>(entidad =>
        {
            entidad.Property(m => m.NombreCompleto).IsRequired().HasMaxLength(200);
            entidad.Property(m => m.Especialidad).IsRequired().HasMaxLength(150);
        });

        modelBuilder.Entity<Paciente>(entidad =>
        {
            entidad.Property(p => p.NombreCompleto).IsRequired().HasMaxLength(200);
            entidad.Property(p => p.Telefono).HasMaxLength(20);
            entidad.Property(p => p.Email).HasMaxLength(200);
        });

        modelBuilder.Entity<Usuario>(entidad =>
        {
            entidad.Property(u => u.NombreUsuario).IsRequired().HasMaxLength(100);
            entidad.Property(u => u.PasswordHash).IsRequired();

            // Dos usuarios no pueden compartir el mismo nombre de usuario para iniciar sesión.
            entidad.HasIndex(u => u.NombreUsuario).IsUnique();
        });

        modelBuilder.Entity<Cita>(entidad =>
        {
            entidad.HasOne(c => c.Medico)
                .WithMany(m => m.Citas)
                .HasForeignKey(c => c.MedicoId)
                .OnDelete(DeleteBehavior.Restrict);

            entidad.HasOne(c => c.Paciente)
                .WithMany(p => p.Citas)
                .HasForeignKey(c => c.PacienteId)
                .OnDelete(DeleteBehavior.Restrict);

            // Acelera la búsqueda de traslapes de horario por médico (la validación
            // de traslape en sí se hace en la capa Application, no aquí).
            entidad.HasIndex(c => new { c.MedicoId, c.FechaHoraInicio });
        });
    }
}
