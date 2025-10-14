using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MoviesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MoviesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<Movie>>> GetMovies()
        {
            return Ok(await _context.Movies.ToListAsync());
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<Movie>>> SearchMovies(string query)
        {
            var movies = await _context.Movies
                .Where(m =>
                    EF.Functions.TrigramsWordSimilarity(m.Title, query) > 0.1 ||
                    EF.Functions.TrigramsSimilarity(m.Title, query) > 0.15 ||
                    EF.Functions.ILike(m.Title, $"%{query}%"))
                .OrderByDescending(m =>
                    EF.Functions.TrigramsWordSimilarity(m.Title, query) +
                    EF.Functions.TrigramsSimilarity(m.Title, query) * 0.7)
                .Take(30)
                .ToListAsync();
            return Ok(movies);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Movie>> GetMovie(int id)
        {
            var movie = await _context.Movies.FindAsync(id);
            if (movie == null) return NotFound();
            return Ok(movie);
        }

        [HttpPost]
        public async Task<ActionResult<Movie>> CreateMovie(Movie movie)
        {
            _context.Movies.Add(movie);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetMovie), new { id = movie.Id }, movie);
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

