using backend.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using backend.Interfaces;

namespace backend.Controllers
{
    [ApiController]
    [Route("/api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;

        private readonly UserContext _userContext;

        private readonly IS3Service _s3Service;

        public AuthController(IConfiguration config,UserContext userContext, IS3Service s3Service)
        {
            _config = config;
            _userContext = userContext;
            _s3Service = s3Service; 
        }

        public class LoginRequest
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {

                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest("Email and password are required");
                }

                var user = await _userContext.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (user == null)
                {
                    return BadRequest("Invalid email or password");
                }


                bool isValidPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.HashedPassword);
                if (!isValidPassword)
                {
                    return BadRequest("Invalid email or password");
                }


                var token = GenerateJwtToken(user);

                try
                {

                    user.LastLogin = DateTime.UtcNow;
                    await _userContext.SaveChangesAsync();
                }
                catch (Exception ex)
                {

                    Console.WriteLine($"Error updating last login: {ex.Message}");
                }

  
                return Ok(new
                {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    token = token
                });
            }
            catch (Exception ex)
            {
      
                Console.WriteLine($"Login error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, "An error occurred during login. Please try again later.");
            }
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public class SignupRequest
        {
            public string Username { get; set; }
            public string Email { get; set; }
            public string Password { get; set; }
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupRequest request)
        {
            try
            {
  
                if (string.IsNullOrEmpty(request.Username) || 
                    string.IsNullOrEmpty(request.Email) || 
                    string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest("All fields are required");
                }

  
                if (_userContext.Users.Any(u => u.Email == request.Email))
                {
                    return BadRequest("User with this email already exists");
                }

    
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
                var user = new User
                {
                    Username = request.Username,
                    Email = request.Email,
                    HashedPassword = hashedPassword,
                    CreatedAt = DateTime.UtcNow
                };

                _userContext.Users.Add(user);
                await _userContext.SaveChangesAsync();

                int Id = user.Id;

                await _s3Service.CreateUniqueFolder(Id);

                return Ok(new { message = "User registered successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred during registration");
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var user = await _userContext.Users.FindAsync(int.Parse(userId));
                if (user == null)
                {
                    return NotFound();
                }

                return Ok(new
                {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while fetching user data");
            }
        }

    }
}
