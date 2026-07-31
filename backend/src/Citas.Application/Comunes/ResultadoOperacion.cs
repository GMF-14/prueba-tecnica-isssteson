namespace Citas.Application.Comunes;

public enum TipoResultado
{
    Exito,
    NoEncontrado,
    ErrorValidacion
}

// Evita usar excepciones para comunicar reglas de negocio: el controller
// traduce cada TipoResultado a un código HTTP (200/201, 404, 400).
public class ResultadoOperacion<T>
{
    public TipoResultado Tipo { get; private init; }
    public string? Error { get; private init; }
    public T? Valor { get; private init; }

    public static ResultadoOperacion<T> Exito(T valor) => new() { Tipo = TipoResultado.Exito, Valor = valor };
    public static ResultadoOperacion<T> NoEncontrado() => new() { Tipo = TipoResultado.NoEncontrado };
    public static ResultadoOperacion<T> Invalido(string error) => new() { Tipo = TipoResultado.ErrorValidacion, Error = error };
}
