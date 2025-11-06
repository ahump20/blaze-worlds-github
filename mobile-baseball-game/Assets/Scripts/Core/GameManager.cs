using UnityEngine;
using System;
using System.Collections.Generic;

namespace BackyardBlazeBaseball.Core
{
    /// <summary>
    /// Central game manager - handles game state, systems, and lifecycle
    /// Singleton pattern for global access
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        #region Singleton
        public static GameManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSystems();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        #endregion

        [Header("Game State")]
        [SerializeField] private GameState currentState = GameState.MainMenu;
        [SerializeField] private GameMode currentGameMode = GameMode.QuickPlay;

        [Header("System References")]
        [SerializeField] private SaveManager saveManager;
        [SerializeField] private AudioManager audioManager;
        [SerializeField] private UnlockSystem unlockSystem;

        [Header("Game Settings")]
        [SerializeField] private GameSettings settings;

        [Header("Current Match Data")]
        public MatchData currentMatch;

        // Events
        public event Action<GameState> OnStateChanged;
        public event Action<GameMode> OnGameModeChanged;
        public event Action OnGameStarted;
        public event Action<Team> OnGameEnded;

        private void InitializeSystems()
        {
            Debug.Log("[GameManager] Initializing game systems...");

            // Initialize core systems
            if (saveManager != null)
                saveManager.Initialize();
            else
                Debug.LogError("[GameManager] SaveManager not assigned!");

            if (audioManager != null)
                audioManager.Initialize();
            else
                Debug.LogError("[GameManager] AudioManager not assigned!");

            if (unlockSystem != null)
                unlockSystem.Initialize();
            else
                Debug.LogError("[GameManager] UnlockSystem not assigned!");

            // Load settings
            if (settings == null)
                settings = GameSettings.Default();

            Debug.Log("[GameManager] Systems initialized successfully");
        }

        #region State Management
        public void ChangeState(GameState newState)
        {
            if (currentState == newState)
                return;

            GameState previousState = currentState;
            currentState = newState;

            Debug.Log($"[GameManager] State changed: {previousState} -> {newState}");

            OnStateChanged?.Invoke(newState);

            // Handle state-specific logic
            HandleStateChange(newState);
        }

        private void HandleStateChange(GameState state)
        {
            switch (state)
            {
                case GameState.MainMenu:
                    HandleMainMenuState();
                    break;

                case GameState.TeamSelection:
                    HandleTeamSelectionState();
                    break;

                case GameState.Loading:
                    HandleLoadingState();
                    break;

                case GameState.Gameplay:
                    HandleGameplayState();
                    break;

                case GameState.Paused:
                    HandlePausedState();
                    break;

                case GameState.GameOver:
                    HandleGameOverState();
                    break;
            }
        }

        private void HandleMainMenuState()
        {
            Time.timeScale = 1f;
            if (audioManager != null)
                audioManager.PlayMusic("MainMenu");
        }

        private void HandleTeamSelectionState()
        {
            if (audioManager != null)
                audioManager.PlayMusic("TeamSelection");
        }

        private void HandleLoadingState()
        {
            // Loading screen logic handled by scene management
        }

        private void HandleGameplayState()
        {
            Time.timeScale = 1f;
            if (audioManager != null)
                audioManager.PlayMusic("Gameplay");

            OnGameStarted?.Invoke();
        }

        private void HandlePausedState()
        {
            Time.timeScale = 0f;
        }

        private void HandleGameOverState()
        {
            Time.timeScale = 1f;

            if (currentMatch != null && currentMatch.winningTeam != null)
            {
                OnGameEnded?.Invoke(currentMatch.winningTeam);

                // Save game result
                if (saveManager != null)
                    saveManager.SaveMatchResult(currentMatch);
            }
        }

        public GameState GetCurrentState()
        {
            return currentState;
        }
        #endregion

        #region Game Mode Management
        public void SetGameMode(GameMode mode)
        {
            currentGameMode = mode;
            Debug.Log($"[GameManager] Game mode set to: {mode}");

            OnGameModeChanged?.Invoke(mode);
        }

        public GameMode GetCurrentGameMode()
        {
            return currentGameMode;
        }
        #endregion

        #region Match Management
        public void StartMatch(Team homeTeam, Team awayTeam, int innings = 9)
        {
            Debug.Log($"[GameManager] Starting match: {awayTeam.teamName} @ {homeTeam.teamName}");

            currentMatch = new MatchData
            {
                homeTeam = homeTeam,
                awayTeam = awayTeam,
                totalInnings = innings,
                startTime = DateTime.Now
            };

            ChangeState(GameState.Loading);

            // Load gameplay scene (handled by SceneManager)
            UnityEngine.SceneManagement.SceneManager.LoadScene("GameplayScene");
        }

        public void EndMatch(Team winner)
        {
            if (currentMatch == null)
            {
                Debug.LogError("[GameManager] Trying to end match but no match in progress!");
                return;
            }

            currentMatch.winningTeam = winner;
            currentMatch.endTime = DateTime.Now;

            Debug.Log($"[GameManager] Match ended. Winner: {winner.teamName}");

            ChangeState(GameState.GameOver);
        }
        #endregion

        #region Application Lifecycle
        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                // Save game when app is backgrounded
                if (saveManager != null)
                    saveManager.SaveGame();

                Debug.Log("[GameManager] App paused - game saved");
            }
        }

        private void OnApplicationQuit()
        {
            // Final save before quit
            if (saveManager != null)
                saveManager.SaveGame();

            Debug.Log("[GameManager] App quitting - final save completed");
        }
        #endregion

        #region Settings
        public GameSettings GetSettings()
        {
            return settings;
        }

        public void UpdateSettings(GameSettings newSettings)
        {
            settings = newSettings;

            // Apply settings
            ApplySettings();

            // Save settings
            if (saveManager != null)
                saveManager.SaveSettings(settings);
        }

        private void ApplySettings()
        {
            // Audio settings
            if (audioManager != null)
            {
                audioManager.SetMusicVolume(settings.musicVolume);
                audioManager.SetSFXVolume(settings.sfxVolume);
            }

            // Graphics settings
            QualitySettings.SetQualityLevel(settings.graphicsQuality);

            // Frame rate
            Application.targetFrameRate = settings.targetFrameRate;
        }
        #endregion

        #region Utility
        public SaveManager GetSaveManager() => saveManager;
        public AudioManager GetAudioManager() => audioManager;
        public UnlockSystem GetUnlockSystem() => unlockSystem;
        #endregion
    }

    #region Enums
    public enum GameState
    {
        MainMenu,
        TeamSelection,
        Loading,
        Gameplay,
        Paused,
        GameOver
    }

    public enum GameMode
    {
        QuickPlay,
        Season,
        Tournament,
        HomeRunDerby,
        Practice
    }
    #endregion

    #region Data Classes
    [System.Serializable]
    public class MatchData
    {
        public Team homeTeam;
        public Team awayTeam;
        public Team winningTeam;

        public int totalInnings;
        public int homeScore;
        public int awayScore;

        public DateTime startTime;
        public DateTime endTime;

        public List<InningData> innings = new List<InningData>();

        public TimeSpan GetDuration()
        {
            return endTime - startTime;
        }
    }

    [System.Serializable]
    public class InningData
    {
        public int inningNumber;
        public int topRuns;
        public int bottomRuns;
    }

    [System.Serializable]
    public class GameSettings
    {
        [Header("Audio")]
        [Range(0f, 1f)] public float musicVolume = 0.7f;
        [Range(0f, 1f)] public float sfxVolume = 0.8f;
        [Range(0f, 1f)] public float voiceVolume = 0.9f;

        [Header("Graphics")]
        [Range(0, 3)] public int graphicsQuality = 2; // 0=Low, 1=Medium, 2=High, 3=Ultra
        public int targetFrameRate = 60;

        [Header("Gameplay")]
        public DifficultyLevel difficulty = DifficultyLevel.Normal;
        public bool autoFielding = true;
        public bool autoBaseRunning = false;
        public bool showHitZone = true;
        public bool showPitchPath = true;

        [Header("Accessibility")]
        public bool hapticFeedback = true;
        public bool colorblindMode = false;
        public bool reducedMotion = false;

        public static GameSettings Default()
        {
            return new GameSettings
            {
                musicVolume = 0.7f,
                sfxVolume = 0.8f,
                voiceVolume = 0.9f,
                graphicsQuality = 2,
                targetFrameRate = 60,
                difficulty = DifficultyLevel.Normal,
                autoFielding = true,
                autoBaseRunning = false,
                showHitZone = true,
                showPitchPath = true,
                hapticFeedback = true,
                colorblindMode = false,
                reducedMotion = false
            };
        }
    }

    public enum DifficultyLevel
    {
        Easy,
        Normal,
        Hard,
        Expert
    }
    #endregion
}
