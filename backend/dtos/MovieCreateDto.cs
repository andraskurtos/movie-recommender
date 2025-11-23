namespace backend.Dtos
{
    public class MovieCreateDto
    {
        public string Title { get; set; } = "";
        public int Year { get; set; }
        public string BackdropUrl { get; set; } = "";
        public string PosterUrl { get; set; } = "";
        public string OriginalLanguage { get; set; } = "";
        public string Overview { get; set; } = "";
        public List<int> Genres { get; set; } = new List<int>();
    }
}