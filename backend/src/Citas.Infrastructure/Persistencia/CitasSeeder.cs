using Citas.Domain.Entidades;
using Citas.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Citas.Infrastructure.Persistencia;

// A diferencia de Medicos/Pacientes (sembrados vía HasData en la migración),
// las Citas se generan en tiempo de ejecución con fechas relativas a "hoy":
// si se sembraran con HasData, las fechas quedarían fijas en el momento en que
// se generó la migración y se verían "viejas" al levantar el proyecto después.
public static class CitasSeeder
{
    private static readonly int[] HorasDisponibles = [9, 10, 11, 12, 16, 17];
    private const int CantidadMedicos = 5;
    private const int CantidadPacientes = 8;

    public static async Task SeedAsync(CitasDbContext dbContext)
    {
        if (await dbContext.Citas.AnyAsync())
        {
            return;
        }

        var random = new Random(2026);
        var citas = new List<Cita>();

        for (var diasAdelante = 0; diasAdelante <= 6; diasAdelante++)
        {
            var fecha = DateTime.Today.AddDays(diasAdelante);

            // No se agendan citas en fin de semana.
            if (fecha.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            {
                continue;
            }

            for (var medicoId = 1; medicoId <= CantidadMedicos; medicoId++)
            {
                // No todos los médicos tienen cita todos los días, para que se vea variado.
                if (random.Next(0, 100) < 30)
                {
                    continue;
                }

                var hora = HorasDisponibles[random.Next(HorasDisponibles.Length)];
                var pacienteId = random.Next(1, CantidadPacientes + 1);
                var inicio = fecha.AddHours(hora);

                citas.Add(new Cita
                {
                    MedicoId = medicoId,
                    PacienteId = pacienteId,
                    FechaHoraInicio = inicio,
                    FechaHoraFin = inicio.AddMinutes(Cita.DuracionMinutos),
                    Estado = random.Next(0, 100) < 10 ? EstadoCita.Cancelada : EstadoCita.Programada
                });
            }
        }

        dbContext.Citas.AddRange(citas);
        await dbContext.SaveChangesAsync();
    }
}
