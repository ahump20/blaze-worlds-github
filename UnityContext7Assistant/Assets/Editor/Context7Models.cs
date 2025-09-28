using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace BlazeIntelligence.Context7
{
    [Serializable]
    public sealed class Context7SearchResponse
    {
        [JsonProperty("error")]
        public string? Error { get; set; }

        [JsonProperty("results")]
        public List<Context7SearchResult> Results { get; set; } = new();
    }

    [Serializable]
    public sealed class Context7SearchResult
    {
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        [JsonProperty("title")]
        public string Title { get; set; } = string.Empty;

        [JsonProperty("description")]
        public string Description { get; set; } = string.Empty;

        [JsonProperty("branch")]
        public string Branch { get; set; } = string.Empty;

        [JsonProperty("lastUpdateDate")]
        public string LastUpdateDate { get; set; } = string.Empty;

        [JsonProperty("state")]
        public string State { get; set; } = string.Empty;

        [JsonProperty("totalTokens")]
        public int TotalTokens { get; set; }

        [JsonProperty("totalSnippets")]
        public int TotalSnippets { get; set; }

        [JsonProperty("totalPages")]
        public int TotalPages { get; set; }

        [JsonProperty("stars")]
        public int? Stars { get; set; }

        [JsonProperty("trustScore")]
        public double? TrustScore { get; set; }

        [JsonProperty("versions")]
        public List<string>? Versions { get; set; }
    }
}
