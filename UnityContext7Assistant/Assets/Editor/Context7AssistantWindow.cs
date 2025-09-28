using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UnityEditor;
using UnityEngine;

namespace BlazeIntelligence.Context7
{
    public sealed class Context7AssistantWindow : EditorWindow
    {
        private string _query = string.Empty;
        private readonly List<Context7SearchResult> _results = new();
        private Context7SearchResult? _selectedResult;
        private string _documentation = string.Empty;
        private bool _isSearching;
        private bool _isFetchingDocumentation;
        private string? _errorMessage;
        private int _tokenBudget = 3000;
        private string _topicFilter = string.Empty;
        private string _apiKeyInput = string.Empty;
        private string _clientIp = string.Empty;
        private string _baseUrl = string.Empty;
        private Vector2 _resultsScroll;
        private Vector2 _documentationScroll;
        private CancellationTokenSource? _requestCts;

        [MenuItem("Blaze Intelligence/Context7 Assistant")]
        private static void Open()
        {
            var window = GetWindow<Context7AssistantWindow>(utility: false, title: "Context7 Assistant");
            window.minSize = new Vector2(640, 480);
            window.Show();
        }

        private void OnEnable()
        {
            _baseUrl = EditorPrefs.GetString("Context7.BaseUrl", "https://context7.com/api");
            _tokenBudget = EditorPrefs.GetInt("Context7.DefaultTokens", 3000);
            _topicFilter = EditorPrefs.GetString("Context7.LastTopic", string.Empty);
            _clientIp = Environment.GetEnvironmentVariable("CONTEXT7_CLIENT_IP") ?? string.Empty;
            var envApiKey = Environment.GetEnvironmentVariable("CONTEXT7_API_KEY");
            _apiKeyInput = string.IsNullOrWhiteSpace(envApiKey) ? string.Empty : envApiKey!;
        }

        private void OnDisable()
        {
            _requestCts?.Cancel();
            _requestCts?.Dispose();
            EditorPrefs.SetString("Context7.BaseUrl", _baseUrl);
            EditorPrefs.SetInt("Context7.DefaultTokens", _tokenBudget);
            EditorPrefs.SetString("Context7.LastTopic", _topicFilter);
        }

        private void OnGUI()
        {
            EditorGUILayout.LabelField("Context7 Unity Assistant", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "Query Context7 for up-to-date documentation and code examples without leaving the Unity Editor.",
                MessageType.Info);

            DrawConfiguration();
            DrawSearchArea();

            using (new EditorGUILayout.HorizontalScope())
            {
                DrawResultsList();
                DrawDocumentationPanel();
            }
        }

        private void DrawConfiguration()
        {
            EditorGUILayout.Space();
            EditorGUILayout.LabelField("Configuration", EditorStyles.boldLabel);

            EditorGUI.BeginChangeCheck();
            _baseUrl = EditorGUILayout.TextField("API URL", string.IsNullOrWhiteSpace(_baseUrl) ? "https://context7.com/api" : _baseUrl);
            if (EditorGUI.EndChangeCheck())
            {
                _baseUrl = string.IsNullOrWhiteSpace(_baseUrl) ? "https://context7.com/api" : _baseUrl.TrimEnd('/');
            }

            _tokenBudget = EditorGUILayout.IntSlider("Token Budget", _tokenBudget, 500, 8000);
            _topicFilter = EditorGUILayout.TextField("Topic (optional)", _topicFilter);

            EditorGUILayout.Space(4f);
            EditorGUILayout.LabelField("Session Credentials", EditorStyles.boldLabel);
            using (new EditorGUILayout.HorizontalScope())
            {
                EditorGUILayout.LabelField("API Key", GUILayout.Width(60));
                using (new EditorGUI.DisabledScope(true))
                {
                    EditorGUILayout.LabelField("Loaded from ENV if set (CONTEXT7_API_KEY)");
                }
            }
            _apiKeyInput = EditorGUILayout.PasswordField(_apiKeyInput);
            _clientIp = EditorGUILayout.TextField("Client IP (optional)", _clientIp);
        }

        private void DrawSearchArea()
        {
            EditorGUILayout.Space();
            EditorGUILayout.LabelField("Search Libraries", EditorStyles.boldLabel);

            using (new EditorGUILayout.HorizontalScope())
            {
                GUI.enabled = !_isSearching;
                _query = EditorGUILayout.TextField(_query);
                if (GUILayout.Button("Search", GUILayout.Width(100)))
                {
                    _ = ExecuteSearchAsync();
                }
                GUI.enabled = true;
            }

            if (_errorMessage is { Length: > 0 })
            {
                EditorGUILayout.HelpBox(_errorMessage, MessageType.Error);
            }
        }

        private void DrawResultsList()
        {
            using (new EditorGUILayout.VerticalScope(GUILayout.Width(position.width * 0.35f)))
            {
                EditorGUILayout.LabelField("Results", EditorStyles.boldLabel);
                using (var scroll = new EditorGUILayout.ScrollViewScope(_resultsScroll))
                {
                    _resultsScroll = scroll.scrollPosition;
                    if (_results.Count == 0)
                    {
                        EditorGUILayout.LabelField(_isSearching ? "Searching..." : "No results yet. Try a query.");
                    }
                    else
                    {
                        foreach (var result in _results)
                        {
                            DrawResultItem(result);
                        }
                    }
                }
            }
        }

        private void DrawResultItem(Context7SearchResult result)
        {
            using (new EditorGUILayout.VerticalScope("box"))
            {
                var title = string.IsNullOrWhiteSpace(result.Title) ? result.Id : result.Title;
                var selected = _selectedResult == result;
                var label = new GUIContent(title, result.Description);

                using (new EditorGUILayout.HorizontalScope())
                {
                    if (GUILayout.Toggle(selected, label, "Button"))
                    {
                        if (!selected)
                        {
                            _selectedResult = result;
                            _ = FetchDocumentationAsync();
                        }
                    }

                    if (GUILayout.Button("Copy ID", GUILayout.Width(80)))
                    {
                        EditorGUIUtility.systemCopyBuffer = result.Id;
                        ShowNotification(new GUIContent("Library ID copied."));
                    }
                }

                if (!string.IsNullOrWhiteSpace(result.Description))
                {
                    EditorGUILayout.LabelField(result.Description, EditorStyles.wordWrappedMiniLabel);
                }

                EditorGUILayout.LabelField($"Tokens: {result.TotalTokens}  Snippets: {result.TotalSnippets}  Pages: {result.TotalPages}");
                if (result.TrustScore.HasValue)
                {
                    EditorGUILayout.LabelField($"Trust Score: {result.TrustScore:0.00}");
                }
                if (result.Versions is { Count: > 0 })
                {
                    EditorGUILayout.LabelField("Versions:", string.Join(", ", result.Versions.Take(5)));
                }
            }
        }

        private void DrawDocumentationPanel()
        {
            using (new EditorGUILayout.VerticalScope())
            {
                EditorGUILayout.LabelField("Documentation", EditorStyles.boldLabel);
                GUI.enabled = _selectedResult != null && !_isFetchingDocumentation;
                if (GUILayout.Button("Refresh Context"))
                {
                    _ = FetchDocumentationAsync();
                }
                GUI.enabled = true;

                using (var scroll = new EditorGUILayout.ScrollViewScope(_documentationScroll))
                {
                    _documentationScroll = scroll.scrollPosition;
                    var content = string.IsNullOrEmpty(_documentation)
                        ? (_isFetchingDocumentation ? "Fetching documentation..." : "Select a result to load documentation.")
                        : _documentation;
                    EditorGUILayout.TextArea(content, GUILayout.ExpandHeight(true));
                }
            }
        }

        private async Task ExecuteSearchAsync()
        {
            CancelPendingRequest();
            _isSearching = true;
            _errorMessage = null;
            _results.Clear();
            _selectedResult = null;
            _documentation = string.Empty;
            Repaint();

            _requestCts = new CancellationTokenSource();
            try
            {
                var response = await Context7ApiClient.SearchAsync(
                    _query,
                    ResolveApiKey(),
                    SanitizeClientIp(_clientIp),
                    _baseUrl,
                    _requestCts.Token);

                if (!string.IsNullOrWhiteSpace(response.Error))
                {
                    _errorMessage = response.Error;
                }

                _results.AddRange(response.Results);
                if (_results.Count == 0 && string.IsNullOrEmpty(_errorMessage))
                {
                    _errorMessage = "No libraries matched your query.";
                }
            }
            catch (Exception ex)
            {
                _errorMessage = ex.Message;
                Debug.LogError($"[Context7] Search failed: {ex}");
            }
            finally
            {
                _isSearching = false;
                _requestCts.Dispose();
                _requestCts = null;
                Repaint();
            }
        }

        private async Task FetchDocumentationAsync()
        {
            if (_selectedResult == null)
            {
                return;
            }

            CancelPendingRequest();
            _isFetchingDocumentation = true;
            _documentation = string.Empty;
            _errorMessage = null;
            Repaint();

            _requestCts = new CancellationTokenSource();
            try
            {
                var topic = string.IsNullOrWhiteSpace(_topicFilter) ? null : _topicFilter;
                var text = await Context7ApiClient.FetchDocumentationAsync(
                    _selectedResult.Id,
                    _tokenBudget,
                    topic,
                    ResolveApiKey(),
                    SanitizeClientIp(_clientIp),
                    _baseUrl,
                    _requestCts.Token);
                _documentation = text;
            }
            catch (Exception ex)
            {
                _errorMessage = ex.Message;
                Debug.LogError($"[Context7] Documentation fetch failed: {ex}");
            }
            finally
            {
                _isFetchingDocumentation = false;
                _requestCts.Dispose();
                _requestCts = null;
                Repaint();
            }
        }

        private void CancelPendingRequest()
        {
            if (_requestCts == null)
            {
                return;
            }

            if (!_requestCts.IsCancellationRequested)
            {
                _requestCts.Cancel();
            }
            _requestCts.Dispose();
            _requestCts = null;
        }

        private string? ResolveApiKey()
        {
            return string.IsNullOrWhiteSpace(_apiKeyInput) ? null : _apiKeyInput.Trim();
        }

        private static string? SanitizeClientIp(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return value.Trim();
        }
    }
}
