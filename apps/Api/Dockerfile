FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props ./
COPY apps/Api/.editorconfig apps/Api/
COPY Common/src/TestCraft.Common/TestCraft.Common.csproj Common/src/TestCraft.Common/
COPY apps/Api/src/TestCraft.Domain/TestCraft.Domain.csproj apps/Api/src/TestCraft.Domain/
COPY apps/Api/src/TestCraft.Application/TestCraft.Application.csproj apps/Api/src/TestCraft.Application/
COPY apps/Api/src/TestCraft.Persistence/TestCraft.Persistence.csproj apps/Api/src/TestCraft.Persistence/
COPY apps/Api/src/TestCraft.Infrastructure/TestCraft.Infrastructure.csproj apps/Api/src/TestCraft.Infrastructure/
COPY apps/Api/src/TestCraft.Api/TestCraft.Api.csproj apps/Api/src/TestCraft.Api/

RUN dotnet restore apps/Api/src/TestCraft.Api/TestCraft.Api.csproj

COPY Common/src/ Common/src/
COPY apps/Api/src/ apps/Api/src/

RUN dotnet publish apps/Api/src/TestCraft.Api/TestCraft.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache curl krb5-libs && \
    addgroup -S -g 1001 appgroup && \
    adduser -S -u 1001 -G appgroup -H appuser

COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

ENTRYPOINT ["dotnet", "TestCraft.Api.dll"]
