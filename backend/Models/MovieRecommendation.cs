using System.Text.Json.Serialization;

namespace backend.Models
{
    public class MovieRecommendation
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("year")]
        public int? Year { get; set; }

        [JsonPropertyName("predicted_rating")]
        public float PredictedRating { get; set; }
    }
}