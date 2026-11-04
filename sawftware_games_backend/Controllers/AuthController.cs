using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TestWebsiteApi.Data;
using TestWebsiteApi.Dtos;
using TestWebsiteApi.Models;

namespace TestWebsiteApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Name, email, and password are required.");
        }

        // PostgreSQL text equality is case sensitive, unlike typical SQL Server collations.
        var email = request.Email.ToLowerInvariant();
        var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
        if (emailExists)
        {
            return Conflict("That email is already registered.");
        }

        var user = new User
        {
            Name = request.Name,
            Email = request.Email
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var email = request.Email.ToLowerInvariant();
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user is null)
        {
            return Unauthorized("Invalid email or password.");
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (result == PasswordVerificationResult.Failed)
        {
            return Unauthorized("Invalid email or password.");
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email)
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal);

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email
        });
    }
}
