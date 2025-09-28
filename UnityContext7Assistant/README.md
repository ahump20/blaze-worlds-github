# Blaze Intelligence Context7 Unity Assistant

This Unity Editor extension integrates the [Context7](https://github.com/upstash/context7) documentation service directly into the Unity workflow. It lets Blaze Intelligence developers query real-time library documentation, browse search results, and pull contextual code snippets without leaving the editor.

## Features

- 🔍 Search any npm or package registry entry supported by Context7.
- 📄 Stream the latest documentation/context for the selected library.
- 🔁 Quickly refresh snippets as you iterate on Unity scripts.
- 🔐 Keeps API keys outside the project by using environment variables.

## Project Layout

```
UnityContext7Assistant/
├── Assets/
│   └── Editor/
│       ├── Context7ApiClient.cs
│       ├── Context7AssistantWindow.cs
│       └── Context7Models.cs
└── Packages/
    └── manifest.json
```

Add this folder to an existing Unity project or open it standalone to bootstrap a new workspace.

## Prerequisites

1. Unity 2021.3 LTS or newer (required for the async/await capable UnityWebRequest API).
2. A Context7 API key from [context7.com](https://context7.com). Keys should look like `ctx7sk_...`.
3. macOS, Windows, or Linux editor with outbound HTTPS access to `https://context7.com`.

## Setup

1. Copy the `UnityContext7Assistant` directory into your Unity project root.
2. Ensure the Newtonsoft JSON package installs (Unity will import `com.unity.nuget.newtonsoft-json@3.2.1` automatically on open).
3. Provide credentials securely:
   - Set `CONTEXT7_API_KEY` in your shell or CI environment. **Do not** commit keys to source control.
   - (Optional) Set `CONTEXT7_CLIENT_IP` if you want to forward a static IP for rate limiting purposes.
4. Launch Unity. The editor scripts compile automatically.
5. Open the window via **Blaze Intelligence ▸ Context7 Assistant**.

## Using the Assistant

1. Enter a search query (for example: `Unity Addressables`).
2. Select a result to load tokens and documentation.
3. Adjust the token budget or topic filter to focus on specific areas (e.g., `async loading`).
4. Copy library identifiers into your prompts or Unity code as needed.

The window caches non-sensitive preferences (API base URL, token budget, topic filter) via `EditorPrefs`. Secrets remain in memory only.

## Troubleshooting

- **401 Unauthorized** – verify the API key is present and valid.
- **429 Rate Limited** – Context7 throttles aggressive usage; try again later or reduce automation frequency.
- **Empty results** – confirm the package exists or broaden your search query.

## Extending the Integration

- Hook the `Context7ApiClient` into custom editor tools or inspectors to surface targeted docs inline.
- Persist workspace-specific defaults via scriptable objects if you need project-level overrides.
- Add structured logging or analytics by wrapping the `Context7ApiClient` calls (ensure no secrets are logged).

## Security Notes

- Keep API keys out of version control—use environment variables or Unity Cloud Build secrets.
- UnityWebRequest transmits over HTTPS only; no plaintext transport is used.
- Consider proxy configuration if your network requires outbound filtering.

## Testing Strategy

Unity editor scripts rely on manual verification. For automated coverage, create Edit Mode tests that mock `UnityWebRequest` using `UnityEngine.TestTools` and assert parsing/formatting logic.

