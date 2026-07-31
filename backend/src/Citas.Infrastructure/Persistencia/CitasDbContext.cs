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

            // Catálogo de ejemplo para que la aplicación no se vea vacía.
            entidad.HasData(
                new Medico { Id = 1, NombreCompleto = "Dra. Ana Pérez", Especialidad = "Pediatría", Activo = true },
                new Medico { Id = 2, NombreCompleto = "Dr. Carlos Ramírez", Especialidad = "Cardiología", Activo = true },
                new Medico { Id = 3, NombreCompleto = "Dra. Lucía Fernández", Especialidad = "Dermatología", Activo = true },
                new Medico { Id = 4, NombreCompleto = "Dr. Miguel Torres", Especialidad = "Traumatología", Activo = true },
                new Medico { Id = 5, NombreCompleto = "Dra. Sofía Gómez", Especialidad = "Ginecología", Activo = true }
            );
        });

        modelBuilder.Entity<Paciente>(entidad =>
        {
            entidad.Property(p => p.NombreCompleto).IsRequired().HasMaxLength(200);
            entidad.Property(p => p.Telefono).HasMaxLength(20);
            entidad.Property(p => p.Email).HasMaxLength(200);

            // Catálogo de ejemplo para que la aplicación no se vea vacía.
            entidad.HasData(
                new Paciente { Id = 1, NombreCompleto = "Juan López", Telefono = "6621234567", Email = "juan.lopez@correo.com", Activo = true },
                new Paciente { Id = 2, NombreCompleto = "María Hernández", Telefono = "6627654321", Email = "maria.hernandez@correo.com", Activo = true },
                new Paciente { Id = 3, NombreCompleto = "Pedro Sánchez", Telefono = "6621112233", Email = "pedro.sanchez@correo.com", Activo = true },
                new Paciente { Id = 4, NombreCompleto = "Laura Martínez", Telefono = "6624445566", Email = "laura.martinez@correo.com", Activo = true },
                new Paciente { Id = 5, NombreCompleto = "Roberto Díaz", Telefono = "6627778899", Email = "roberto.diaz@correo.com", Activo = true },
                new Paciente { Id = 6, NombreCompleto = "Carmen Ruiz", Telefono = "6620001122", Email = "carmen.ruiz@correo.com", Activo = true },
                new Paciente { Id = 7, NombreCompleto = "Fernando Castro", Telefono = "6623334455", Email = "fernando.castro@correo.com", Activo = true },
                new Paciente { Id = 8, NombreCompleto = "Patricia Morales", Telefono = "6626667788", Email = "patricia.morales@correo.com", Activo = true }
            );
        });

        modelBuilder.Entity<Usuario>(entidad =>
        {
            entidad.Property(u => u.NombreUsuario).IsRequired().HasMaxLength(100);
            entidad.Property(u => u.PasswordHash).IsRequired();

            // Dos usuarios no pueden compartir el mismo nombre de usuario para iniciar sesión.
            entidad.HasIndex(u => u.NombreUsuario).IsUnique();

            // Usuario seed para poder iniciar sesión sin un endpoint de registro
            // (no está en los requisitos). Password: Admin123! (hash BCrypt precalculado).
            entidad.HasData(new Usuario
            {
                Id = 1,
                NombreUsuario = "admin",
                PasswordHash = "$2a$11$oX8FybCxSeGMeAtWOuctxOZNJu1ckCuWEcBiy0fz5Ll/vZ8VPfC6q",
                Nombre = "Administrador",
                Activo = true
            });
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
