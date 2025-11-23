using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Dtos;
using System.Diagnostics;
using System.Text.Json;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecommendationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RecommendationsController> _logger;

        public RecommendationsController(AppDbContext context, ILogger<RecommendationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private static string NormalizeTitle(string title)
        {
            // First convert to lowercase for case-insensitive comparison
            title = title.ToLower();
            
            // Handle ", The", ", A", ", An" at the end
            if (title.EndsWith(", the"))
                return "the " + title.Substring(0, title.Length - 5);
            if (title.EndsWith(", a"))
                return "a " + title.Substring(0, title.Length - 3);
            if (title.EndsWith(", an"))
                return "an " + title.Substring(0, title.Length - 4);
            
            return title;
        }

        // GET: api/Recommendations
        [HttpGet("{userId}")]
        public async Task<ActionResult<List<RecommendationResponseDto>>> GetRecommendations(int userId)
        {
            try
            {

                // Get user's existing ratings
                var userRatings = await _context.UserRatings
                    .Where(r => r.User.Id == userId)
                    .Select(r => new { r.Movie.Id, r.Rating })
                    .ToListAsync();

                // Get full movie details for the ratings and convert ratings from 1-10 to 0.5-5 scale
                var userRatingsWithMovies = await _context.UserRatings
                    .Where(r => r.User.Id == userId)
                    .Select(r => new 
                    { 
                        title = r.Movie.Title,
                        year = r.Movie.Year,
                        rating = r.Rating * 0.5f // Convert from 1-10 to 0.5-5 scale
                    })
                    .ToListAsync();

                // Convert ratings to the format expected by the Python script
                var ratingsJson = System.Text.Json.JsonSerializer.Serialize(userRatingsWithMovies);
                _logger.LogInformation($"User ratings being sent to Python: {ratingsJson}");
                // Escape the JSON string for command line argument
                var escapedJson = ratingsJson.Replace("\"", "\\\"");

                // Call the Python script
                var startInfo = new ProcessStartInfo
                {
                    FileName = "/home/andrish/university/szakdoga/movie-recommender/recommender_env/bin/python",
                    Arguments = $"/home/andrish/university/szakdoga/movie-recommender/model/recommend.py --user-id {userId} --ratings \"{escapedJson}\"",
                    WorkingDirectory = "/home/andrish/university/szakdoga/movie-recommender/model",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = new Process { StartInfo = startInfo };
                process.Start();

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync();

                _logger.LogInformation($"Python script output: {output}");
                _logger.LogInformation($"Python script error output: {error}");
                _logger.LogInformation($"Python script exit code: {process.ExitCode}");

                if (process.ExitCode != 0)
                {
                    _logger.LogError($"Python script error: {error}");
                    return StatusCode(500, "Error generating recommendations");
                }

                // Parse recommendations from the Python script output
                var recommendations = System.Text.Json.JsonSerializer.Deserialize<List<MovieRecommendation>>(output);
                _logger.LogInformation($"Deserialized recommendations count: {recommendations?.Count ?? 0}");
                if (recommendations != null)
                {
                    foreach (var rec in recommendations)
                    {
                        _logger.LogInformation($"Recommendation: Title={rec.Title}, Year={rec.Year}, Rating={rec.PredictedRating}");
                    }
                }

                // Get movie details for recommended movies by matching title and year
                var recommendedMovies = new List<(Movie Movie, float PredictedRating)>();
                
                if (recommendations != null)
                {
                    foreach (var rec in recommendations)
                    {
                        var title = rec.Title ?? "";
                        // Remove year from title if it exists at the end (format: " (YYYY)")
                        if (title.EndsWith($" ({rec.Year})"))
                        {
                            title = title.Substring(0, title.Length - 7);
                        }
                        var year = rec.Year ?? 0;
                        var predictedRating = rec.PredictedRating;

                        var normalizedSearchTitle = NormalizeTitle(title);
                        _logger.LogInformation($"Searching for movie: Title='{title}' (normalized: '{normalizedSearchTitle}'), Year={year}");
                        
                        // First filter by year in the database query
                        var potentialMatches = await _context.Movies
                            .Include(m => m.Genres)
                            .Where(m => m.Year == year)
                            .ToListAsync();

                        // Then find the matching title in memory
                        var movie = potentialMatches
                            .FirstOrDefault(m => NormalizeTitle(m.Title) == normalizedSearchTitle);

                        if (movie != null)
                        {
                            _logger.LogInformation($"Found matching movie in database: ID={movie.Id}, Title='{movie.Title}', Year={movie.Year}");
                            recommendedMovies.Add((movie, predictedRating));
                        }
                        else
                        {
                            _logger.LogWarning($"No matching movie found in database for: Title='{title}', Year={year}");
                        }
                    }
                }

                // Create response DTOs
                var recommendationDtos = recommendedMovies.Select(rec =>
                    new RecommendationResponseDto
                    {
                        Movie = new MovieResponseDto
                        {
                            Id = rec.Movie.Id,
                            Title = rec.Movie.Title,
                            Year = rec.Movie.Year,
                            BackdropUrl = rec.Movie.BackdropUrl,
                            PosterUrl = rec.Movie.PosterUrl,
                            OriginalLanguage = rec.Movie.OriginalLanguage,
                            Overview = rec.Movie.Overview,
                            Genres = rec.Movie.Genres.Select(g => g.TmdbId).ToList()
                        },
                        PredictedRating = rec.PredictedRating
                    }).ToList();

                return Ok(recommendationDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting recommendations: {ex}");
                return StatusCode(500, "Error generating recommendations");
            }
        }
    }
}
