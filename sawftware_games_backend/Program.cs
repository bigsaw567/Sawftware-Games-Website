using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using TestWebsiteApi.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using System.Net;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var knownProxy = builder.Configuration["ReverseProxy:KnownProxy"];
if (!string.IsNullOrWhiteSpace(knownProxy))
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
        options.KnownProxies.Add(IPAddress.Parse(knownProxy));
        options.ForwardLimit = 1;
    });
}

var keysPath = builder.Configuration["DataProtection:KeysPath"];
if (!string.IsNullOrWhiteSpace(keysPath))
{
    builder.Services.AddDataProtection()
        .SetApplicationName("SawftwareGames")
        .PersistKeysToFileSystem(new DirectoryInfo(keysPath));
}

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularDev", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var connectionString = DatabaseConnection.Resolve(builder.Configuration);

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Explicit deployment command; ordinary API startup never applies migrations.
if (args.Contains("--migrate"))
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    app.Logger.LogInformation("PostgreSQL migrations applied successfully.");
    return;
}

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AngularDev");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", async (AppDbContext context, CancellationToken cancellationToken) =>
    await context.Database.CanConnectAsync(cancellationToken)
        ? Results.Ok(new { status = "ready" })
        : Results.StatusCode(StatusCodes.Status503ServiceUnavailable));

app.Run();
