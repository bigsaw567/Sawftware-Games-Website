using Npgsql;

namespace TestWebsiteApi.Data;

public static class DatabaseConnection
{
    public static string Resolve(IConfiguration configuration)
    {
        // Compose passes separate values so passwords containing delimiters remain valid.
        if (!string.IsNullOrWhiteSpace(configuration["Database:Host"]))
        {
            string Required(string key) => !string.IsNullOrWhiteSpace(configuration[key])
                ? configuration[key]!
                : throw new InvalidOperationException($"Configure {key} for the deployment database.");

            return new NpgsqlConnectionStringBuilder
            {
                Host = Required("Database:Host"),
                Port = configuration.GetValue("Database:Port", 5432),
                Database = Required("Database:Name"),
                Username = Required("Database:User"),
                Password = Required("Database:Password"),
                MaxPoolSize = configuration.GetValue("Database:MaxPoolSize", 10),
                Timeout = 10
            }.ConnectionString;
        }

        var connectionString = configuration.GetConnectionString("TestWebsiteDb");
        return !string.IsNullOrWhiteSpace(connectionString) ? connectionString
            : throw new InvalidOperationException(
                "Configure ConnectionStrings:TestWebsiteDb using .NET user secrets or " +
                "ConnectionStrings__TestWebsiteDb, or the Database settings for Compose. See POSTGRESQL.md.");
    }
}
