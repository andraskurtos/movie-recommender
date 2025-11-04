using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using backend.Dtos;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GenresController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GenresController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<GenreResponseDto>>> GetGenres()
        {
            var genres = await _context.Genres
                .Include(g => g.Movies)
                .Select(g => new GenreResponseDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    TmdbId = g.TmdbId,
                    MovieIds = g.Movies.Select(m => m.Id).ToList()
                })
                .ToListAsync();
            return Ok(genres);
        }

        [HttpPost]
        public async Task<ActionResult<Genre>> CreateGenre(GenreCreateDto genreDto)
        {
            // Check if genre with the same TMDB ID already exists
            var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.TmdbId == genreDto.TmdbId);
            if (existingGenre != null)
            {
                // Return HTTP 200 OK with the existing genre and a custom header
                Response.Headers.Append("X-Genre-Status", "Existing");
                var existingGenreDto = new GenreResponseDto
                {
                    Id = existingGenre.Id,
                    Name = existingGenre.Name,
                    TmdbId = existingGenre.TmdbId,
                    MovieIds = new List<int>()
                };
                return Ok(existingGenreDto);
            }

            var genre = new Genre
            {
                Name = genreDto.Name,
                TmdbId = genreDto.TmdbId
            };

            _context.Genres.Add(genre);
            await _context.SaveChangesAsync();

            var genreResponseDto = new GenreResponseDto
            {
                Id = genre.Id,
                Name = genre.Name,
                TmdbId = genre.TmdbId,
                MovieIds = new List<int>()
            };
            return CreatedAtAction(nameof(GetGenre), new { id = genre.Id }, genreResponseDto);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GenreResponseDto>> GetGenre(int id)
        {
            var genre = await _context.Genres
                .Include(g => g.Movies)
                .FirstOrDefaultAsync(g => g.Id == id);
            
            if (genre == null) return NotFound();
            
            var genreDto = new GenreResponseDto
            {
                Id = genre.Id,
                Name = genre.Name,
                TmdbId = genre.TmdbId,
                MovieIds = genre.Movies.Select(m => m.Id).ToList()
            };
            return Ok(genreDto);
        }
    }
}