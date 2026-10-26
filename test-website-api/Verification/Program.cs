using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;
using TestWebsiteApi.Data;

var configuration = new ConfigurationBuilder()
    .AddUserSecrets("test-website-api-local-postgresql")
    .AddEnvironmentVariables()
    .Build();
var connectionString = configuration.GetConnectionString("TestWebsiteDb")
    ?? throw new InvalidOperationException("Run Configure-Postgres.ps1 first.");
await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();
Console.WriteLine($"Connected to PostgreSQL {connection.PostgreSqlVersion} / {connection.Database}.");
await using (var command = new NpgsqlCommand(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename", connection))
await using (var reader = await command.ExecuteReaderAsync())
{
    while (await reader.ReadAsync()) Console.WriteLine($"Existing table: {reader.GetString(0)}");
}

await using var context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(connectionString).Options);
if (args.Contains("--apply-migrations"))
{
    await context.Database.MigrateAsync();
    Console.WriteLine("PostgreSQL migrations applied.");
}
if ((await context.Database.GetPendingMigrationsAsync()).Any())
    throw new InvalidOperationException("Pending migrations. Inspect the database, then rerun with --apply-migrations.");
if (!args.Contains("--api")) return;

// Launch a private instance of the real API; credentials are inherited through configuration.
var start = new ProcessStartInfo("dotnet") { UseShellExecute = false };
start.ArgumentList.Add(typeof(AppDbContext).Assembly.Location);
start.ArgumentList.Add("--urls");
start.ArgumentList.Add("http://127.0.0.1:15014");
start.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
using var server = Process.Start(start) ?? throw new InvalidOperationException("Could not start API.");
using var client = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false })
    { BaseAddress = new Uri("http://127.0.0.1:15014") };
var email = $"pg-smoke-{Guid.NewGuid():N}@example.invalid";
var password = Guid.NewGuid().ToString("N") + "aA!7";
try
{
    var ready = false;
    for (var attempt = 0; attempt < 50; attempt++)
    {
        if (server.HasExited) throw new InvalidOperationException("API exited before becoming ready.");
        try
        {
            using var response = await client.GetAsync("/api/users");
            if (response.IsSuccessStatusCode) { ready = true; break; }
        }
        catch (HttpRequestException) { }
        await Task.Delay(200);
    }
    if (!ready) throw new InvalidOperationException("API did not become ready.");
    using var preflight = new HttpRequestMessage(HttpMethod.Options, "/api/auth/login");
    preflight.Headers.Add("Origin", "http://localhost:4200");
    preflight.Headers.Add("Access-Control-Request-Method", "POST");
    preflight.Headers.Add("Access-Control-Request-Headers", "content-type");
    using var cors = await client.SendAsync(preflight);
    if (!cors.IsSuccessStatusCode ||
        !cors.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins) ||
        !origins.Contains("http://localhost:4200") ||
        !cors.Headers.TryGetValues("Access-Control-Allow-Credentials", out var credentials) ||
        !credentials.Contains("true"))
        throw new InvalidOperationException("Angular CORS preflight failed.");
    Console.WriteLine("PASS Angular CORS preflight with credentials.");
    async Task<HttpResponseMessage> Post(string path, object body, HttpStatusCode expected)
    {
        var response = await client.PostAsJsonAsync(path, body);
        if (response.StatusCode != expected)
            throw new InvalidOperationException($"{path}: expected {(int)expected}, got {(int)response.StatusCode}.");
        Console.WriteLine($"PASS {path}: {(int)expected}");
        return response;
    }
    using var signup = await Post("/api/auth/signup", new { name = "PostgreSQL smoke test Ω", email, password }, HttpStatusCode.OK);
    var user = await signup.Content.ReadFromJsonAsync<JsonElement>();
    var id = user.GetProperty("id").GetInt32();
    if (id <= 0) throw new InvalidOperationException("Identity was not generated.");
    using var duplicate = await Post("/api/auth/signup", new { name = "Duplicate", email = email.ToUpperInvariant(), password }, HttpStatusCode.Conflict);
    using var login = await Post("/api/auth/login", new { email = email.ToUpperInvariant(), password }, HttpStatusCode.OK);
    if (!login.Headers.TryGetValues("Set-Cookie", out var cookies) ||
        !cookies.Any(cookie => cookie.Contains(".AspNetCore.Cookies=")))
        throw new InvalidOperationException("Login did not issue an authentication cookie.");
    using var invalid = await Post("/api/auth/login", new { email, password = "wrong" }, HttpStatusCode.Unauthorized);
    using var missing = await Post("/api/auth/login", new { email = "missing-" + email, password }, HttpStatusCode.Unauthorized);
    using var blank = await Post("/api/auth/signup", new { name = "", email, password }, HttpStatusCode.BadRequest);
    var users = await client.GetFromJsonAsync<JsonElement[]>("/api/users") ?? [];
    var listed = users.Single(u => u.GetProperty("id").GetInt32() == id);
    if (listed.GetProperty("name").GetString() != "PostgreSQL smoke test Ω" || listed.TryGetProperty("passwordHash", out _))
        throw new InvalidOperationException("User projection or Unicode round trip failed.");
    var saved = await context.Users.SingleAsync(u => u.Id == id);
    if (saved.PasswordHash == password || string.IsNullOrEmpty(saved.PasswordHash))
        throw new InvalidOperationException("Password was not hashed.");
    Console.WriteLine("PASS users list, generated identity, Unicode, password hashing, and login cookie.");
}
finally
{
    try
    {
        await context.Users.Where(u => u.Email == email).ExecuteDeleteAsync();
        Console.WriteLine("Smoke-test account removed.");
    }
    finally
    {
        if (!server.HasExited) { server.Kill(entireProcessTree: true); await server.WaitForExitAsync(); }
        Console.WriteLine("Verification API stopped.");
    }
}
