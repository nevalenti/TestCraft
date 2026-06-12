FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props ./
COPY apps/Gateway/src/TestCraft.Gateway/TestCraft.Gateway.csproj apps/Gateway/src/TestCraft.Gateway/

RUN dotnet restore apps/Gateway/src/TestCraft.Gateway/TestCraft.Gateway.csproj

COPY apps/Gateway/src/ apps/Gateway/src/

RUN dotnet publish apps/Gateway/src/TestCraft.Gateway/TestCraft.Gateway.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache curl && \
    addgroup -S -g 1001 appgroup && \
    adduser -S -u 1001 -G appgroup -H appuser

COPY --from=build /app .

ENV ASPNETCORE_ENVIRONMENT=Production

USER appuser

EXPOSE 80 443 8443

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fk https://localhost/ || exit 1

ENTRYPOINT ["dotnet", "TestCraft.Gateway.dll"]
