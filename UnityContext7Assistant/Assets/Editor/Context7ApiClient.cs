using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using UnityEditor;
using UnityEngine;
using UnityEngine.Networking;

namespace BlazeIntelligence.Context7
{
    internal static class Context7ApiClient
    {
        private const string DefaultBaseUrl = "https://context7.com/api";

        public static async Task<Context7SearchResponse> SearchAsync(
            string query,
            string? apiKey,
            string? clientIp,
            string? baseUrl,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new Context7SearchResponse
                {
                    Error = "Query cannot be empty.",
                };
            }

            var requestUrl = BuildUrl(baseUrl, $"/v1/search?query={UnityWebRequest.EscapeURL(query)}");
            using var request = UnityWebRequest.Get(requestUrl);
            ApplyCommonHeaders(request, apiKey, clientIp);

            return await SendAndParseAsync<Context7SearchResponse>(request, cancellationToken);
        }

        public static async Task<string> FetchDocumentationAsync(
            string libraryId,
            int tokens,
            string? topic,
            string? apiKey,
            string? clientIp,
            string? baseUrl,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(libraryId))
            {
                return "Select a library from the search results first.";
            }

            var builder = new StringBuilder();
            builder.Append($"/v1/{libraryId.TrimStart('/')}");
            var hasQuery = false;

            if (tokens > 0)
            {
                builder.Append(hasQuery ? "&" : "?");
                builder.Append($"tokens={Mathf.Clamp(tokens, 500, 10000)}");
                hasQuery = true;
            }

            builder.Append(hasQuery ? "&" : "?");
            builder.Append("type=txt");
            hasQuery = true;

            if (!string.IsNullOrWhiteSpace(topic))
            {
                builder.Append(hasQuery ? "&" : "?");
                builder.Append($"topic={UnityWebRequest.EscapeURL(topic)}");
            }

            var requestUrl = BuildUrl(baseUrl, builder.ToString());
            using var request = UnityWebRequest.Get(requestUrl);
            ApplyCommonHeaders(request, apiKey, clientIp, ("X-Context7-Source", "unity-editor"));

            return await SendTextAsync(request, cancellationToken);
        }

        private static string BuildUrl(string? baseUrl, string pathAndQuery)
        {
            var root = string.IsNullOrWhiteSpace(baseUrl) ? DefaultBaseUrl : baseUrl.TrimEnd('/');
            return root + pathAndQuery;
        }

        private static void ApplyCommonHeaders(
            UnityWebRequest request,
            string? apiKey,
            string? clientIp,
            params (string Key, string Value)[] extraHeaders)
        {
            request.SetRequestHeader("Accept", "application/json");
            foreach (var (key, value) in extraHeaders)
            {
                request.SetRequestHeader(key, value);
            }

            if (!string.IsNullOrWhiteSpace(clientIp))
            {
                request.SetRequestHeader("mcp-client-ip", clientIp);
            }

            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
            }
        }

        private static async Task<T> SendAndParseAsync<T>(UnityWebRequest request, CancellationToken cancellationToken)
            where T : new()
        {
            var json = await SendTextAsync(request, cancellationToken);
            if (string.IsNullOrEmpty(json))
            {
                return new T();
            }

            try
            {
                return JsonConvert.DeserializeObject<T>(json) ?? new T();
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[Context7] Failed to parse response: {ex.Message}\nRaw: {json}");
                return new T();
            }
        }

        private static async Task<string> SendTextAsync(UnityWebRequest request, CancellationToken cancellationToken)
        {
            request.downloadHandler = new DownloadHandlerBuffer();

            var operation = request.SendWebRequest();
            while (!operation.isDone)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    request.Abort();
                    cancellationToken.ThrowIfCancellationRequested();
                }

                await Task.Yield();
            }

            if (request.result == UnityWebRequest.Result.ConnectionError ||
                request.result == UnityWebRequest.Result.DataProcessingError)
            {
                throw new InvalidOperationException($"Context7 request failed: {request.error}");
            }

            if (request.result == UnityWebRequest.Result.ProtocolError)
            {
                var payload = request.downloadHandler.text;
                throw new InvalidOperationException(
                    $"Context7 returned {(int)request.responseCode}: {request.error}\n{payload}");
            }

            return request.downloadHandler.text;
        }
    }
}
