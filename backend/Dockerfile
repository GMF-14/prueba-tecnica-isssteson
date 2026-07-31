# ===== Etapa de compilación =====
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar solo los .csproj primero para aprovechar el cache de capas de Docker:
# si no cambian las dependencias, no se vuelve a ejecutar el restore.
COPY Citas.sln ./
COPY src/Citas.Domain/Citas.Domain.csproj src/Citas.Domain/
COPY src/Citas.Application/Citas.Application.csproj src/Citas.Application/
COPY src/Citas.Infrastructure/Citas.Infrastructure.csproj src/Citas.Infrastructure/
COPY src/Citas.Api/Citas.Api.csproj src/Citas.Api/
COPY tests/Citas.Tests/Citas.Tests.csproj tests/Citas.Tests/
RUN dotnet restore Citas.sln

COPY . .
RUN dotnet publish src/Citas.Api/Citas.Api.csproj -c Release -o /app/publish --no-restore

# ===== Etapa de ejecución =====
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Citas.Api.dll"]
