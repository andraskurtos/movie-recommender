using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Movie
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; } = "";
        public int Year { get; set; }
        public string BackdropUrl { get; set; } = "";
        public string PosterUrl { get; set; } = "";
        public string OriginalLanguage { get; set; } = "";
        public string Overview { get; set; } = "";

        // --- New Properties ---
        public int Runtime { get; set; }
        public string Tagline { get; set; } = "";
        public double VoteAverage { get; set; }
        public string ProductionCompany { get; set; } = "";
        public string Director { get; set; } = "";

        // Use ICollection<Genre> for EF Core navigation properties
        public ICollection<Genre> Genres { get; set; } = new List<Genre>();
    }
}
