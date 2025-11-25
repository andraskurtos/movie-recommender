using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/User
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users
                .Select(u => new User
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    DisplayName = u.DisplayName,
                    ProfilePictureUrl = u.ProfilePictureUrl,
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt
                })
                .ToListAsync();
        }

        [HttpDelete("{id}/ratings/{ratingId}")]
        public async Task<IActionResult> DeleteUser(int id, int ratingId)
        {
            var rating = await _context.UserRatings
                .FirstOrDefaultAsync(r => r.Id == ratingId && r.User.Id == id);

            if (rating == null)
            {
                return NotFound("Rating not found");
            }

            _context.UserRatings.Remove(rating);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/User/5/ratings
        [HttpGet("{id}/ratings")]
        public async Task<ActionResult<IEnumerable<object>>> GetUserRatings(int id)
        {
            var ratings = await _context.UserRatings
                .Where(r => r.User.Id == id)
                .Include(r => r.Movie)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    id = r.Id,
                    movie = new
                    {
                        id = r.Movie.Id,
                        title = r.Movie.Title,
                        year = r.Movie.Year,
                        posterUrl = r.Movie.PosterUrl
                    },
                    rating = r.Rating,
                    reviewText = r.Review,
                    createdAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(ratings);
        }

        // GET: api/User/5/rating-stats
        [HttpGet("{id}/rating-stats")]
        public async Task<ActionResult<object>> GetUserRatingStats(int id)
        {
            var ratings = await _context.UserRatings
                .Where(r => r.User.Id == id)
                .ToListAsync();

            var ratingCount = ratings.Count;
            var averageRating = ratingCount > 0 ? ratings.Average(r => r.Rating) : 0;

            return Ok(new
            {
                ratingCount = ratingCount,
                averageRating = Math.Round(averageRating, 1)
            });
        }

        // GET: api/User/5
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users
                .Select(u => new User
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    DisplayName = u.DisplayName,
                    ProfilePictureUrl = u.ProfilePictureUrl,
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt
                })
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        // POST: api/User
        [HttpPost]
        public async Task<ActionResult<User>> CreateUser(CreateUserDto userDto)
        {
            if (await _context.Users.AnyAsync(u => u.Username == userDto.Username))
            {
                return BadRequest("Username already exists");
            }

            if (await _context.Users.AnyAsync(u => u.Email == userDto.Email))
            {
                return BadRequest("Email already exists");
            }

            var user = new User
            {
                Username = userDto.Username,
                Email = userDto.Email,
                DisplayName = userDto.DisplayName,
                PasswordHash = HashPassword(userDto.Password),
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Return user without sensitive data
            return CreatedAtAction(
                nameof(GetUser),
                new { id = user.Id },
                new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    user.DisplayName,
                    user.ProfilePictureUrl,
                    user.CreatedAt,
                    user.LastLoginAt
                }
            );
        }

        // PUT: api/User/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto userDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Only update provided fields
            if (!string.IsNullOrEmpty(userDto.DisplayName))
                user.DisplayName = userDto.DisplayName;
            if (!string.IsNullOrEmpty(userDto.ProfilePictureUrl))
                user.ProfilePictureUrl = userDto.ProfilePictureUrl;
            if (!string.IsNullOrEmpty(userDto.Password))
                user.PasswordHash = HashPassword(userDto.Password);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpPost("{id}/profile-picture")]
        public async Task<IActionResult> UploadProfilePicture(int id, IFormFile file)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            var uploadsFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Uploads");
            if (!Directory.Exists(uploadsFolderPath))
            {
                Directory.CreateDirectory(uploadsFolderPath);
            }

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolderPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            user.ProfilePictureUrl = $"/Uploads/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(new { profilePictureUrl = user.ProfilePictureUrl });
        }

        // POST: api/User/login
        [HttpPost("login")]
        public async Task<ActionResult<User>> Login(LoginDto loginDto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == loginDto.Username);

            if (user == null)
            {
                // Use the same message for both cases to not leak information
                return Unauthorized("Invalid username or password");
            }

            if (!VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid username or password");
            }

            // Update last login time
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Return user without sensitive data
            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.DisplayName,
                user.ProfilePictureUrl,
                user.CreatedAt,
                user.LastLoginAt
            });
        }

        // POST: api/User/{id}/ratings
        [HttpPost("{id}/ratings")]
        public async Task<ActionResult<object>> AddRating(int id, AddRatingDto ratingDto)
        {
            // Validate rating is between 1 and 10
            if (ratingDto.Rating < 1 || ratingDto.Rating > 10)
            {
                return BadRequest("Rating must be between 1 and 10");
            }

            // Check if user exists
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Check if movie exists
            var movie = await _context.Movies.FindAsync(ratingDto.MovieId);
            if (movie == null)
            {
                return NotFound("Movie not found");
            }

            // Check if user has already rated this movie
            var existingRating = await _context.UserRatings
                .FirstOrDefaultAsync(r => r.User.Id == id && r.Movie.Id == ratingDto.MovieId);

            if (existingRating != null)
            {
                // Update existing rating
                existingRating.Rating = ratingDto.Rating;
                existingRating.Review = ratingDto.Review;
                existingRating.UpdatedAt = DateTime.UtcNow;
                _context.UserRatings.Update(existingRating);
            }
            else
            {
                // Create new rating
                var newRating = new UserRating
                {
                    User = user,
                    Movie = movie,
                    Rating = ratingDto.Rating,
                    Review = ratingDto.Review,
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserRatings.Add(newRating);
            }

            await _context.SaveChangesAsync();

            // Return the rating with movie details
            var rating = await _context.UserRatings
                .Where(r => r.User.Id == id && r.Movie.Id == ratingDto.MovieId)
                .Include(r => r.Movie)
                .Select(r => new
                {
                    id = r.Id,
                    movie = new
                    {
                        id = r.Movie.Id,
                        title = r.Movie.Title,
                        year = r.Movie.Year,
                        posterUrl = r.Movie.PosterUrl
                    },
                    rating = r.Rating,
                    reviewText = r.Review,
                    createdAt = r.CreatedAt
                })
                .FirstOrDefaultAsync();

            return Ok(rating);
        }

        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.Id == id);
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string inputPassword, string storedHash)
        {
            string inputHash = HashPassword(inputPassword);
            return inputHash == storedHash;
        }
    }

    public class LoginDto
    {
        public required string Username { get; set; }
        public required string Password { get; set; }
    }

    public class CreateUserDto
    {
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public string? DisplayName { get; set; }
    }

    public class UpdateUserDto
    {
        public string? DisplayName { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? Password { get; set; }
    }

    public class AddRatingDto
    {
        public int MovieId { get; set; }
        public int Rating { get; set; }
        public string? Review { get; set; }
    }
}