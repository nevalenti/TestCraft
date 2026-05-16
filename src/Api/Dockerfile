FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG TARGETARCH
WORKDIR /app

COPY Directory.Build.props Directory.Packages.props ./
COPY src/Domain/Domain.csproj src/Domain/
COPY src/Application/Application.csproj src/Application/
COPY src/Infrastructure/Infrastructure.csproj src/Infrastructure/
COPY src/Api/Api.csproj src/Api/

RUN dotnet restore src/Api/Api.csproj -a $TARGETARCH

COPY src/ src/

RUN dotnet publish src/Api/Api.csproj -c Release -a $TARGETARCH -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN groupadd --system --gid 1001 appgroup \
    && useradd --system --uid 1001 --gid appgroup --no-create-home appuser

COPY --from=build /app/publish .

USER appuser

EXPOSE 8080

ENTRYPOINT ["dotnet", "Api.dll"]
