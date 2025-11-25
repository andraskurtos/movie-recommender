namespace backend.Dtos
{
    public class MovieResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public int Year { get; set; }
        public string BackdropUrl { get; set; } = "";
        public string PosterUrl { get; set; } = "";
        public string OriginalLanguage { get; set; } = "";
        public string Overview { get; set; } = "";
        public List<int> Genres { get; set; } = new List<int>();

        // --- New Properties ---
        public int Runtime { get; set; }
        public string Tagline { get; set; } = "";
        public double VoteAverage { get; set; }
        public string ProductionCompany { get; set; } = "";
        public string Director { get; set; } = "";
    }
}
