namespace backend.Dtos
{
    public class GenreResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public int TmdbId { get; set; }
        public List<int> MovieIds { get; set; } = new List<int>();
    }
}