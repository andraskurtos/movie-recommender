using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using backend.Dtos;
using System.Text.RegularExpressions;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MoviesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static readonly HashSet<string> Stopwords = new HashSet<string>
        {
            "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", 
            "if", "in", "into", "is", "it", "no", "not", "of", "on", "or", 
            "such", "that", "the", "their", "then", "there", "these", "they", 
            "this", "to", "was", "will", "with"
        };

        public MoviesController(AppDbContext context)
        {
            _context = context;
        }
        
        private string RemoveStopwords(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return text;
                
            // Split the text into words
            var words = Regex.Split(text.ToLower(), @"\W+")
                             .Where(word => !string.IsNullOrWhiteSpace(word))
                             .ToList();
                             
            // If query is only stopwords, return the original text
            if (words.All(word => Stopwords.Contains(word)))
                return text;
                
            // Remove stopwords and join the remaining words
            var filteredWords = words.Where(word => !Stopwords.Contains(word)).ToList();
            return string.Join(" ", filteredWords);
        }

        [HttpGet]
        public async Task<ActionResult<List<Movie>>> GetMovies()
        {
            return Ok(await _context.Movies.OrderBy(m => m.Title).ToListAsync());
        }

        [HttpGet("paginated")]
        public async Task<ActionResult<PaginatedResponseDto<MovieResponseDto>>> GetMoviesPaginated(int page = 1, int pageSize = 100)
        {
            // Validate pagination parameters
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 100;
            if (pageSize > 500) pageSize = 500; // Cap max page size

            var query = _context.Movies.OrderBy(m => m.Title);
            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var movies = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(m => new MovieResponseDto
                {
                    Id = m.Id,
                    Title = m.Title,
                    Year = m.Year,
                    BackdropUrl = m.BackdropUrl,
                    PosterUrl = m.PosterUrl,
                    OriginalLanguage = m.OriginalLanguage,
                    Overview = m.Overview,
                    Genres = m.Genres.Select(g => g.Id).ToList()
                })
                .ToListAsync();

            var response = new PaginatedResponseDto<MovieResponseDto>
            {
                Data = movies,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };

            return Ok(response);
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<Movie>>> SearchMovies(string query)
        {
            var normalizedQuery = query.ToLower().Trim();
            
            // Remove stopwords for improved matching (if original query has more than just stopwords)
            var cleanedQuery = RemoveStopwords(normalizedQuery);
            
            var searchQuery = string.IsNullOrWhiteSpace(cleanedQuery) ? normalizedQuery : cleanedQuery;
            
            // get potential matches from the database
            var potentialMatches = await _context.Movies
                .Where(m =>
                    // match against both the original title and title with stopwords removed
                    EF.Functions.TrigramsWordSimilarity(m.Title, searchQuery) > 0.3 ||
                    EF.Functions.TrigramsSimilarity(m.Title, searchQuery) > 0.3 ||
                    EF.Functions.ILike(m.Title, $"%{searchQuery}%") ||
                    // also search by full query if the cleaned query is different
                    (searchQuery != normalizedQuery && 
                    (EF.Functions.TrigramsWordSimilarity(m.Title, normalizedQuery) > 0.6 ||
                     EF.Functions.ILike(m.Title, $"%{normalizedQuery}%"))))
                .ToListAsync();
                
            if (potentialMatches.Count == 0) return Ok(new List<Movie>());
            
            // process the results in memory to apply more advanced filtering
            var rankedMovies = potentialMatches
                .Select(m => new 
                {
                    Movie = m,
                    // Get a clean version of the movie title for comparison
                    CleanTitle = RemoveStopwords(m.Title.ToLower()),
                    // Calculate various match scores
                    ExactOriginalMatch = m.Title.ToLower() == normalizedQuery ? 1000 : 0,
                    ExactCleanMatch = RemoveStopwords(m.Title.ToLower()) == searchQuery ? 800 : 0,
                    StartsWithMatch = m.Title.ToLower().StartsWith(searchQuery) ? 500 : 0,
                    SimilarityScore = 
                        (m.Title.ToLower().Contains(searchQuery) ? 300 : 0) +
                        (searchQuery != normalizedQuery && m.Title.ToLower().Contains(normalizedQuery) ? 150 : 0)
                })
                .OrderByDescending(item => item.ExactOriginalMatch)
                .ThenByDescending(item => item.ExactCleanMatch)
                .ThenByDescending(item => item.StartsWithMatch)
                .ThenByDescending(item => item.SimilarityScore)
                .Take(30)
                .Select(item => item.Movie)
                .ToList();
                
            return Ok(rankedMovies);
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<Movie>> GetMovie(int id)
        {
            var movie = await _context.Movies.FindAsync(id);
            if (movie == null) return NotFound();
            return Ok(movie);
        }

        [HttpPost]
        public async Task<ActionResult<MovieResponseDto>> CreateMovie(MovieCreateDto movieDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if a similar movie already exists in the database
            var existingMovie = await _context.Movies
                .Include(m => m.Genres)
                .Where(m => 
                    // Match exact title and year
                    (EF.Functions.ILike(m.Title, movieDto.Title) && m.Year == movieDto.Year) ||
                    // Or very similar title with same year and same poster URL (highly likely to be the same movie)
                    (EF.Functions.TrigramsWordSimilarity(m.Title, movieDto.Title) > 0.8 && 
                     m.Year == movieDto.Year && 
                     !string.IsNullOrEmpty(m.PosterUrl) && 
                     !string.IsNullOrEmpty(movieDto.PosterUrl) &&
                     m.PosterUrl == movieDto.PosterUrl)
                )
                .FirstOrDefaultAsync();

            // If a similar movie exists, return that instead of creating a duplicate
            if (existingMovie != null)
            {
                Console.WriteLine($"Duplicate movie detected: '{movieDto.Title}' ({movieDto.Year}). Using existing movie with ID: {existingMovie.Id}");
                // Return HTTP 200 OK with the existing movie and a custom header
                Response.Headers.Append("X-Movie-Status", "Existing");
                var existingMovieDto = new MovieResponseDto
                {
                    Id = existingMovie.Id,
                    Title = existingMovie.Title,
                    Year = existingMovie.Year,
                    BackdropUrl = existingMovie.BackdropUrl,
                    PosterUrl = existingMovie.PosterUrl,
                    OriginalLanguage = existingMovie.OriginalLanguage,
                    Overview = existingMovie.Overview,
                    Genres = existingMovie.Genres.Select(g => g.Id).ToList()
                };
                return Ok(existingMovieDto);
            }

            var genres = await _context.Genres
                .Where(g => movieDto.Genres.Contains(g.Id))
                .ToListAsync();

            var movie = new Movie
            {
                Title = movieDto.Title,
                Year = movieDto.Year,
                BackdropUrl = movieDto.BackdropUrl,
                PosterUrl = movieDto.PosterUrl,
                OriginalLanguage = movieDto.OriginalLanguage,
                Overview = movieDto.Overview,
                Genres = genres
            };

            try
            {
                _context.Movies.Add(movie);
                await _context.SaveChangesAsync();
                
                var movieResponseDto = new MovieResponseDto
                {
                    Id = movie.Id,
                    Title = movie.Title,
                    Year = movie.Year,
                    BackdropUrl = movie.BackdropUrl,
                    PosterUrl = movie.PosterUrl,
                    OriginalLanguage = movie.OriginalLanguage,
                    Overview = movie.Overview,
                    Genres = movie.Genres.Select(g => g.Id).ToList()
                };
                
                return CreatedAtAction(nameof(GetMovie), new { id = movie.Id }, movieResponseDto);
            }
            catch (Exception ex)
            {
                // Return a 500 with the exception message to help debugging during development
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMovie(int id)
        {
            var movie = await _context.Movies.FindAsync(id);
            if (movie == null) return NotFound();

            _context.Movies.Remove(movie);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

