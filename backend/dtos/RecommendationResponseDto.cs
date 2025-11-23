namespace backend.Dtos
{
    public class RecommendationResponseDto
    {
        public MovieResponseDto Movie { get; set; } = null!;
        public float PredictedRating { get; set; }
    }
}
