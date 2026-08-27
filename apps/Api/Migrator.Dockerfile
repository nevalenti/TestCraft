FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props ./
COPY apps/Api/.editorconfig apps/Api/
COPY apps/Api/src/TestCraft.Domain/TestCraft.Domain.csproj apps/Api/src/TestCraft.Domain/
COPY apps/Api/src/TestCraft.Application/TestCraft.Application.csproj apps/Api/src/TestCraft.Application/
COPY apps/Api/src/TestCraft.Persistence/TestCraft.Persistence.csproj apps/Api/src/TestCraft.Persistence/
COPY apps/Api/src/TestCraft.Migrator/TestCraft.Migrator.csproj apps/Api/src/TestCraft.Migrator/

RUN dotnet restore apps/Api/src/TestCraft.Migrator/TestCraft.Migrator.csproj

COPY apps/Api/src/TestCraft.Domain/ apps/Api/src/TestCraft.Domain/
COPY apps/Api/src/TestCraft.Application/ apps/Api/src/TestCraft.Application/
COPY apps/Api/src/TestCraft.Persistence/ apps/Api/src/TestCraft.Persistence/
COPY apps/Api/src/TestCraft.Migrator/ apps/Api/src/TestCraft.Migrator/

RUN dotnet publish apps/Api/src/TestCraft.Migrator/TestCraft.Migrator.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/runtime:10.0-alpine AS runtime
WORKDIR /app

ARG APK_CACHE_BUST=0
RUN echo "apk-cache-bust=${APK_CACHE_BUST}" && apk update && apk upgrade --no-cache && \
    apk add --no-cache krb5-libs && \
    addgroup -S -g 1001 appgroup && \
    adduser -S -u 1001 -G appgroup -H appuser

COPY --from=build /app .

USER appuser

ENTRYPOINT ["dotnet", "TestCraft.Migrator.dll"]
