# Backyard Blaze Baseball - Technical Architecture
## Mobile Baseball Game - Unity Implementation

**Version:** 1.0
**Engine:** Unity 2022.3 LTS
**Target Platforms:** iOS 13+, Android 8.0+
**Programming Language:** C#

---

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     Game Client                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Presentation Layer                     │  │
│  │  • UI Manager  • Camera System  • Effects        │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Game Logic Layer                       │  │
│  │  • Game Manager  • Match Manager  • State Machine│  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Gameplay Systems Layer                 │  │
│  │  • Pitching  • Batting  • Fielding  • AI        │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Data Layer                             │  │
│  │  • Player Data  • Save System  • Analytics       │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Core Systems Layer                     │  │
│  │  • Input  • Audio  • Physics  • Pooling         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
BackyardBlazeBaseball/
├── Assets/
│   ├── _Project/
│   │   ├── Art/
│   │   │   ├── Characters/
│   │   │   │   ├── Models/
│   │   │   │   ├── Textures/
│   │   │   │   ├── Materials/
│   │   │   │   └── Animations/
│   │   │   ├── Stadiums/
│   │   │   │   ├── Models/
│   │   │   │   ├── Textures/
│   │   │   │   └── Prefabs/
│   │   │   ├── UI/
│   │   │   │   ├── Sprites/
│   │   │   │   ├── Fonts/
│   │   │   │   └── Icons/
│   │   │   └── Effects/
│   │   │       ├── Particles/
│   │   │       └── Shaders/
│   │   ├── Audio/
│   │   │   ├── Music/
│   │   │   ├── SFX/
│   │   │   │   ├── Gameplay/
│   │   │   │   ├── UI/
│   │   │   │   └── Ambient/
│   │   │   └── Voice/
│   │   ├── Scripts/
│   │   │   ├── Core/
│   │   │   │   ├── GameManager.cs
│   │   │   │   ├── SceneManager.cs
│   │   │   │   ├── SaveManager.cs
│   │   │   │   └── AudioManager.cs
│   │   │   ├── Gameplay/
│   │   │   │   ├── Baseball/
│   │   │   │   │   ├── PitchingSystem.cs
│   │   │   │   │   ├── BattingSystem.cs
│   │   │   │   │   ├── FieldingSystem.cs
│   │   │   │   │   └── BaseRunning.cs
│   │   │   │   ├── Match/
│   │   │   │   │   ├── MatchManager.cs
│   │   │   │   │   ├── InningManager.cs
│   │   │   │   │   └── ScoreManager.cs
│   │   │   │   └── AI/
│   │   │   │       ├── AIController.cs
│   │   │   │       ├── AIBatter.cs
│   │   │   │       └── AIFielder.cs
│   │   │   ├── Characters/
│   │   │   │   ├── PlayerController.cs
│   │   │   │   ├── PlayerData.cs
│   │   │   │   ├── PlayerStats.cs
│   │   │   │   └── SpecialAbilities.cs
│   │   │   ├── Input/
│   │   │   │   ├── TouchInputManager.cs
│   │   │   │   ├── GestureDetector.cs
│   │   │   │   └── SwipeHandler.cs
│   │   │   ├── UI/
│   │   │   │   ├── MainMenuUI.cs
│   │   │   │   ├── GameplayUI.cs
│   │   │   │   ├── TeamSelectionUI.cs
│   │   │   │   └── PauseMenuUI.cs
│   │   │   ├── Progression/
│   │   │   │   ├── UnlockSystem.cs
│   │   │   │   ├── AchievementManager.cs
│   │   │   │   └── XPSystem.cs
│   │   │   └── Utilities/
│   │   │       ├── ObjectPool.cs
│   │   │       ├── Extensions.cs
│   │   │       └── Constants.cs
│   │   ├── Prefabs/
│   │   │   ├── Characters/
│   │   │   ├── Balls/
│   │   │   ├── UI/
│   │   │   └── Effects/
│   │   ├── Scenes/
│   │   │   ├── MainMenu.unity
│   │   │   ├── TeamSelection.unity
│   │   │   ├── GameplayScene.unity
│   │   │   └── LoadingScene.unity
│   │   └── Resources/
│   │       ├── Characters/
│   │       ├── Stadiums/
│   │       └── Config/
│   ├── Plugins/
│   │   ├── iOS/
│   │   └── Android/
│   └── StreamingAssets/
├── Packages/
│   └── manifest.json
├── ProjectSettings/
└── README.md
```

---

## 💾 Core Systems

### 1. Game Manager (Singleton)

**Purpose:** Central orchestrator for game state and system management

```csharp
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("Systems")]
    public SaveManager saveManager;
    public AudioManager audioManager;
    public UnlockSystem unlockSystem;

    [Header("Game State")]
    public GameState currentState;
    public GameMode currentGameMode;

    private void Awake()
    {
        // Singleton pattern
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

    private void InitializeSystems()
    {
        // Initialize all core systems
        saveManager.Initialize();
        audioManager.Initialize();
        unlockSystem.Initialize();
    }

    public void ChangeState(GameState newState)
    {
        currentState = newState;
        OnStateChanged?.Invoke(newState);
    }

    public event System.Action<GameState> OnStateChanged;
}

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
```

### 2. Match Manager

**Purpose:** Handles baseball game flow and rules

```csharp
public class MatchManager : MonoBehaviour
{
    [Header("Teams")]
    public Team homeTeam;
    public Team awayTeam;

    [Header("Match State")]
    public int currentInning = 1;
    public bool isTopOfInning = true;
    public int outs = 0;
    public int[] baseRunners = new int[3]; // 1st, 2nd, 3rd base

    [Header("Score")]
    public int homeScore = 0;
    public int awayScore = 0;

    [Header("Settings")]
    public int totalInnings = 9;

    private PitchingSystem pitchingSystem;
    private BattingSystem battingSystem;
    private FieldingSystem fieldingSystem;

    public Team BattingTeam => isTopOfInning ? awayTeam : homeTeam;
    public Team FieldingTeam => isTopOfInning ? homeTeam : awayTeam;

    private void Start()
    {
        InitializeMatch();
    }

    private void InitializeMatch()
    {
        pitchingSystem = GetComponent<PitchingSystem>();
        battingSystem = GetComponent<BattingSystem>();
        fieldingSystem = GetComponent<FieldingSystem>();

        StartNewInning();
    }

    public void StartNewInning()
    {
        outs = 0;
        ClearBases();
        SetupBatter();
        SetupPitcher();

        OnInningStart?.Invoke(currentInning, isTopOfInning);
    }

    public void RecordOut()
    {
        outs++;
        AudioManager.Instance.PlaySFX("Out");

        if (outs >= 3)
        {
            EndHalfInning();
        }
        else
        {
            SetupNextBatter();
        }
    }

    private void EndHalfInning()
    {
        if (isTopOfInning)
        {
            // Switch to bottom of inning
            isTopOfInning = false;
            StartNewInning();
        }
        else
        {
            // End of full inning
            currentInning++;

            if (currentInning > totalInnings)
            {
                EndGame();
            }
            else
            {
                isTopOfInning = true;
                StartNewInning();
            }
        }
    }

    public void AddScore(int runs)
    {
        if (isTopOfInning)
            awayScore += runs;
        else
            homeScore += runs;

        OnScoreChanged?.Invoke(homeScore, awayScore);
    }

    private void EndGame()
    {
        GameManager.Instance.ChangeState(GameState.GameOver);
        OnGameEnd?.Invoke(homeScore > awayScore ? homeTeam : awayTeam);
    }

    private void ClearBases()
    {
        for (int i = 0; i < baseRunners.Length; i++)
            baseRunners[i] = 0;
    }

    private void SetupBatter()
    {
        PlayerController batter = BattingTeam.GetNextBatter();
        battingSystem.SetBatter(batter);
    }

    private void SetupPitcher()
    {
        PlayerController pitcher = FieldingTeam.GetPitcher();
        pitchingSystem.SetPitcher(pitcher);
    }

    private void SetupNextBatter()
    {
        SetupBatter();
    }

    // Events
    public event System.Action<int, bool> OnInningStart;
    public event System.Action<int, int> OnScoreChanged;
    public event System.Action<Team> OnGameEnd;
}
```

### 3. Pitching System

**Purpose:** Handles pitch selection, aiming, and throwing

```csharp
public class PitchingSystem : MonoBehaviour
{
    [Header("Current State")]
    public PlayerController currentPitcher;
    public PitchType selectedPitch = PitchType.Fastball;
    public Vector2 targetLocation; // -1 to 1 for strike zone

    [Header("Settings")]
    public float pitchSpeed = 20f;
    public float controlAccuracy = 0.8f;
    public AnimationCurve pitchCurve;

    [Header("UI")]
    public PitchingUI pitchingUI;

    private bool isPitching = false;
    private Ball currentBall;

    public void SetPitcher(PlayerController pitcher)
    {
        currentPitcher = pitcher;
        pitchSpeed = pitcher.stats.pitchSpeed;
        controlAccuracy = pitcher.stats.pitchControl / 10f;
    }

    public void SelectPitch(PitchType pitchType)
    {
        selectedPitch = pitchType;
        pitchingUI.HighlightPitch(pitchType);
        AudioManager.Instance.PlaySFX("UI_Select");
    }

    public void SetTargetLocation(Vector2 location)
    {
        targetLocation = location;
        pitchingUI.ShowTargetIndicator(location);
    }

    public void ThrowPitch()
    {
        if (isPitching) return;

        isPitching = true;

        // Calculate actual pitch location with control factor
        Vector2 actualLocation = CalculateActualLocation();

        // Create and throw ball
        currentBall = ObjectPool.Instance.GetBall();
        StartCoroutine(AnimatePitch(actualLocation));

        // Trigger pitcher animation
        currentPitcher.animator.SetTrigger("Pitch");

        AudioManager.Instance.PlaySFX("Pitch_Throw");
    }

    private Vector2 CalculateActualLocation()
    {
        // Apply control stat to target location
        float controlOffset = (1f - controlAccuracy) * 0.5f;
        Vector2 randomOffset = new Vector2(
            Random.Range(-controlOffset, controlOffset),
            Random.Range(-controlOffset, controlOffset)
        );

        return targetLocation + randomOffset;
    }

    private IEnumerator AnimatePitch(Vector2 targetPos)
    {
        Vector3 startPos = currentPitcher.transform.position + Vector3.up * 1.5f;
        Vector3 endPos = GetStrikeZonePosition(targetPos);

        float duration = 1f / (pitchSpeed / 20f); // Adjust duration based on pitch speed
        float elapsed = 0f;

        // Apply pitch movement based on type
        Vector3 movementOffset = GetPitchMovement(selectedPitch);

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;

            // Base trajectory
            Vector3 position = Vector3.Lerp(startPos, endPos, t);

            // Apply pitch curve
            float curveValue = pitchCurve.Evaluate(t);
            position += movementOffset * curveValue;

            currentBall.transform.position = position;

            yield return null;
        }

        currentBall.transform.position = endPos;

        // Check if pitch was hit or caught
        OnPitchComplete?.Invoke(targetPos);

        isPitching = false;
    }

    private Vector3 GetPitchMovement(PitchType type)
    {
        switch (type)
        {
            case PitchType.Fastball:
                return Vector3.zero; // Straight

            case PitchType.Curveball:
                return new Vector3(0.5f, -1f, 0); // Breaks down and away

            case PitchType.Changeup:
                return Vector3.down * 0.3f; // Slight drop

            case PitchType.Knuckleball:
                return new Vector3(
                    Random.Range(-0.8f, 0.8f),
                    Random.Range(-0.8f, 0.8f),
                    0
                ); // Unpredictable

            default:
                return Vector3.zero;
        }
    }

    private Vector3 GetStrikeZonePosition(Vector2 target)
    {
        // Convert normalized target (-1 to 1) to world position
        Vector3 platePosition = GameObject.Find("HomePlate").transform.position;
        return platePosition + new Vector3(target.x * 0.3f, 0.8f + target.y * 0.4f, 0);
    }

    public event System.Action<Vector2> OnPitchComplete;
}

public enum PitchType
{
    Fastball,
    Curveball,
    Changeup,
    Knuckleball
}
```

### 4. Batting System

**Purpose:** Handles swing timing, contact detection, and hit physics

```csharp
public class BattingSystem : MonoBehaviour
{
    [Header("Current State")]
    public PlayerController currentBatter;
    public bool isSwinging = false;
    public float swingStartTime;

    [Header("Settings")]
    public float perfectTimingWindow = 0.1f;
    public float goodTimingWindow = 0.2f;
    public AnimationCurve swingCurve;

    [Header("Hit Physics")]
    public float basePower = 10f;
    public float launchAngleVariance = 15f;

    private BattingUI battingUI;
    private PitchingSystem pitchingSystem;

    private void Start()
    {
        battingUI = FindObjectOfType<BattingUI>();
        pitchingSystem = GetComponent<PitchingSystem>();

        pitchingSystem.OnPitchComplete += HandlePitchArrival;
    }

    public void SetBatter(PlayerController batter)
    {
        currentBatter = batter;
        basePower = batter.stats.power;
    }

    public void StartSwing()
    {
        if (isSwinging) return;

        isSwinging = true;
        swingStartTime = Time.time;

        currentBatter.animator.SetTrigger("Swing");
        AudioManager.Instance.PlaySFX("Bat_Swing");

        StartCoroutine(SwingCoroutine());
    }

    private IEnumerator SwingCoroutine()
    {
        yield return new WaitForSeconds(0.3f); // Swing duration

        isSwinging = false;
    }

    private void HandlePitchArrival(Vector2 pitchLocation)
    {
        if (!isSwinging)
        {
            // Didn't swing - check if strike or ball
            if (IsInStrikeZone(pitchLocation))
            {
                OnStrike?.Invoke(false); // Called strike
            }
            else
            {
                OnBall?.Invoke();
            }
            return;
        }

        // Calculate contact quality based on timing
        float timingDiff = Mathf.Abs(Time.time - swingStartTime - 0.15f); // 0.15s is perfect timing

        if (timingDiff <= perfectTimingWindow)
        {
            // Perfect contact!
            HitBall(pitchLocation, ContactQuality.Perfect);
        }
        else if (timingDiff <= goodTimingWindow)
        {
            // Good contact
            HitBall(pitchLocation, ContactQuality.Good);
        }
        else
        {
            // Weak contact or miss
            if (Random.value < 0.5f)
            {
                HitBall(pitchLocation, ContactQuality.Weak);
            }
            else
            {
                OnStrike?.Invoke(true); // Swinging strike
                AudioManager.Instance.PlaySFX("Bat_Miss");
            }
        }
    }

    private void HitBall(Vector2 pitchLocation, ContactQuality quality)
    {
        // Calculate hit direction and power
        float powerMultiplier = quality switch
        {
            ContactQuality.Perfect => 1.0f,
            ContactQuality.Good => 0.7f,
            ContactQuality.Weak => 0.4f,
            _ => 0.5f
        };

        float hitPower = basePower * powerMultiplier * (currentBatter.stats.power / 10f);

        // Calculate launch angle
        float launchAngle = CalculateLaunchAngle(pitchLocation, quality);

        // Calculate direction (pull, center, opposite field)
        float direction = CalculateHitDirection(pitchLocation);

        // Launch ball
        LaunchBall(hitPower, launchAngle, direction);

        // Play appropriate sound
        string soundEffect = quality switch
        {
            ContactQuality.Perfect => "Bat_Hit_Perfect",
            ContactQuality.Good => "Bat_Hit_Good",
            _ => "Bat_Hit_Weak"
        };
        AudioManager.Instance.PlaySFX(soundEffect);

        OnHit?.Invoke(hitPower, launchAngle, direction);
    }

    private float CalculateLaunchAngle(Vector2 pitchLocation, ContactQuality quality)
    {
        // High pitches = pop fly, low pitches = grounder
        float baseAngle = Mathf.Lerp(10f, 50f, (pitchLocation.y + 1f) / 2f);

        // Add variance based on contact quality
        if (quality != ContactQuality.Perfect)
        {
            baseAngle += Random.Range(-launchAngleVariance, launchAngleVariance);
        }

        return Mathf.Clamp(baseAngle, 5f, 60f);
    }

    private float CalculateHitDirection(Vector2 pitchLocation)
    {
        // Inside pitches = pull, outside = opposite field
        return pitchLocation.x * 30f; // -30 to +30 degrees
    }

    private void LaunchBall(float power, float launchAngle, float direction)
    {
        Ball ball = ObjectPool.Instance.GetBall();

        Vector3 launchDirection = Quaternion.Euler(0, direction, launchAngle) * Vector3.forward;

        Rigidbody ballRb = ball.GetComponent<Rigidbody>();
        ballRb.velocity = launchDirection * power;
        ballRb.useGravity = true;

        // Start fielding system
        FindObjectOfType<FieldingSystem>().OnBallHit(ball, ballRb.velocity);
    }

    private bool IsInStrikeZone(Vector2 location)
    {
        return Mathf.Abs(location.x) <= 1f && Mathf.Abs(location.y) <= 1f;
    }

    // Events
    public event System.Action<bool> OnStrike; // swinging strike or called
    public event System.Action OnBall;
    public event System.Action<float, float, float> OnHit; // power, angle, direction
}

public enum ContactQuality
{
    Perfect,
    Good,
    Weak,
    Miss
}
```

### 5. Touch Input Manager

**Purpose:** Unified touch input handling for all gameplay

```csharp
public class TouchInputManager : MonoBehaviour
{
    public static TouchInputManager Instance { get; private set; }

    [Header("Settings")]
    public float swipeThreshold = 50f;
    public float tapMaxDuration = 0.3f;

    private Vector2 touchStartPos;
    private float touchStartTime;
    private bool isTouching = false;

    private void Awake()
    {
        if (Instance == null)
            Instance = this;
        else
            Destroy(gameObject);
    }

    private void Update()
    {
        HandleTouchInput();
    }

    private void HandleTouchInput()
    {
        // Unity Input System (new) or legacy
        #if ENABLE_INPUT_SYSTEM
        HandleNewInputSystem();
        #else
        HandleLegacyInput();
        #endif
    }

    private void HandleLegacyInput()
    {
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);

            switch (touch.phase)
            {
                case TouchPhase.Began:
                    OnTouchStart(touch.position);
                    break;

                case TouchPhase.Moved:
                    OnTouchMove(touch.position);
                    break;

                case TouchPhase.Ended:
                    OnTouchEnd(touch.position);
                    break;
            }
        }
        // Mouse input for testing in editor
        else if (Input.GetMouseButtonDown(0))
        {
            OnTouchStart(Input.mousePosition);
        }
        else if (Input.GetMouseButton(0))
        {
            OnTouchMove(Input.mousePosition);
        }
        else if (Input.GetMouseButtonUp(0))
        {
            OnTouchEnd(Input.mousePosition);
        }
    }

    private void OnTouchStart(Vector2 position)
    {
        touchStartPos = position;
        touchStartTime = Time.time;
        isTouching = true;

        OnTouchBegan?.Invoke(position);
    }

    private void OnTouchMove(Vector2 position)
    {
        if (!isTouching) return;

        Vector2 delta = position - touchStartPos;

        OnTouchMoved?.Invoke(position, delta);

        // Detect swipe
        if (delta.magnitude > swipeThreshold)
        {
            Vector2 direction = delta.normalized;
            OnSwipe?.Invoke(direction);

            // Reset to prevent multiple swipe triggers
            touchStartPos = position;
        }
    }

    private void OnTouchEnd(Vector2 position)
    {
        if (!isTouching) return;

        isTouching = false;
        float duration = Time.time - touchStartTime;
        Vector2 delta = position - touchStartPos;

        // Check for tap
        if (duration <= tapMaxDuration && delta.magnitude < swipeThreshold)
        {
            OnTap?.Invoke(position);
        }

        OnTouchEnded?.Invoke(position);
    }

    // Events
    public event System.Action<Vector2> OnTouchBegan;
    public event System.Action<Vector2, Vector2> OnTouchMoved;
    public event System.Action<Vector2> OnTouchEnded;
    public event System.Action<Vector2> OnTap;
    public event System.Action<Vector2> OnSwipe;
}
```

---

## 📊 Data Architecture

### Player Data Structure

```csharp
[System.Serializable]
public class PlayerData
{
    public string characterID;
    public string characterName;
    public int level;
    public int currentXP;
    public int xpToNextLevel;

    public PlayerStats baseStats;
    public PlayerStats currentStats; // Base + level bonuses

    public SpecialAbility ability;
    public PlayerPosition primaryPosition;
    public PlayerArchetype archetype;

    public PlayerVisuals visuals;

    public int gamesPlayed;
    public PlayerCareerStats careerStats;

    public bool isUnlocked;
}

[System.Serializable]
public class PlayerStats
{
    [Range(1, 10)] public int power;
    [Range(1, 10)] public int contact;
    [Range(1, 10)] public int speed;
    [Range(1, 10)] public int fielding;
    [Range(1, 10)] public int armStrength;
    [Range(1, 10)] public int pitchSpeed;
    [Range(1, 10)] public int pitchControl;

    public static PlayerStats operator +(PlayerStats a, PlayerStats b)
    {
        return new PlayerStats
        {
            power = Mathf.Clamp(a.power + b.power, 1, 10),
            contact = Mathf.Clamp(a.contact + b.contact, 1, 10),
            speed = Mathf.Clamp(a.speed + b.speed, 1, 10),
            fielding = Mathf.Clamp(a.fielding + b.fielding, 1, 10),
            armStrength = Mathf.Clamp(a.armStrength + b.armStrength, 1, 10),
            pitchSpeed = Mathf.Clamp(a.pitchSpeed + b.pitchSpeed, 1, 10),
            pitchControl = Mathf.Clamp(a.pitchControl + b.pitchControl, 1, 10)
        };
    }
}

[System.Serializable]
public class PlayerCareerStats
{
    // Batting
    public int atBats;
    public int hits;
    public int homeRuns;
    public int rbis;
    public int strikeouts;

    // Pitching
    public int inningsPitched;
    public int strikeoutsPitched;
    public int earnedRuns;

    // Fielding
    public int putOuts;
    public int assists;
    public int errors;

    // Calculated properties
    public float BattingAverage => atBats > 0 ? (float)hits / atBats : 0f;
    public float ERA => inningsPitched > 0 ? (earnedRuns * 9f) / inningsPitched : 0f;
    public float FieldingPercentage => (putOuts + assists) > 0 ?
        1f - ((float)errors / (putOuts + assists + errors)) : 0f;
}

public enum PlayerPosition
{
    Pitcher,
    Catcher,
    FirstBase,
    SecondBase,
    ThirdBase,
    Shortstop,
    LeftField,
    CenterField,
    RightField
}

public enum PlayerArchetype
{
    PowerHitter,
    ContactSpecialist,
    Speedster,
    Pitcher,
    Balanced,
    ComicRelief
}
```

### Save System

```csharp
public class SaveManager : MonoBehaviour
{
    private const string SAVE_KEY = "BackyardBlazeSave";

    [System.Serializable]
    public class SaveData
    {
        public List<PlayerData> unlockedCharacters;
        public List<string> unlockedStadiums;
        public List<string> completedAchievements;

        public SeasonProgress seasonProgress;
        public GameSettings settings;

        public int totalGamesPlayed;
        public int totalWins;
        public int totalLosses;

        public DateTime lastPlayed;
    }

    public SaveData currentSave;

    public void Initialize()
    {
        LoadGame();
    }

    public void SaveGame()
    {
        currentSave.lastPlayed = DateTime.Now;

        string json = JsonUtility.ToJson(currentSave, true);

        // Encrypt save data (basic)
        string encryptedData = EncryptString(json);

        PlayerPrefs.SetString(SAVE_KEY, encryptedData);
        PlayerPrefs.Save();

        Debug.Log("Game saved successfully");
    }

    public void LoadGame()
    {
        if (PlayerPrefs.HasKey(SAVE_KEY))
        {
            string encryptedData = PlayerPrefs.GetString(SAVE_KEY);
            string json = DecryptString(encryptedData);

            currentSave = JsonUtility.FromJson<SaveData>(json);

            Debug.Log("Game loaded successfully");
        }
        else
        {
            // Create new save
            currentSave = CreateNewSave();
            SaveGame();
        }
    }

    private SaveData CreateNewSave()
    {
        SaveData newSave = new SaveData
        {
            unlockedCharacters = GetStartingCharacters(),
            unlockedStadiums = GetStartingStadiums(),
            completedAchievements = new List<string>(),
            settings = GameSettings.Default(),
            totalGamesPlayed = 0,
            totalWins = 0,
            totalLosses = 0
        };

        return newSave;
    }

    private List<PlayerData> GetStartingCharacters()
    {
        // Return first 12 characters unlocked by default
        List<PlayerData> starting = new List<PlayerData>();

        // Load from Resources
        PlayerData[] allCharacters = Resources.LoadAll<PlayerDataSO>("Characters")
            .Select(so => so.data).ToArray();

        for (int i = 0; i < Mathf.Min(12, allCharacters.Length); i++)
        {
            allCharacters[i].isUnlocked = true;
            starting.Add(allCharacters[i]);
        }

        return starting;
    }

    private List<string> GetStartingStadiums()
    {
        return new List<string>
        {
            "sunny_meadows",
            "beach_boardwalk",
            "desert_dust",
            "urban_rooftop"
        };
    }

    private string EncryptString(string plainText)
    {
        // Simple XOR encryption (use proper encryption for production)
        byte[] bytes = System.Text.Encoding.UTF8.GetBytes(plainText);
        for (int i = 0; i < bytes.Length; i++)
        {
            bytes[i] ^= 0x5A; // XOR key
        }
        return System.Convert.ToBase64String(bytes);
    }

    private string DecryptString(string encryptedText)
    {
        byte[] bytes = System.Convert.FromBase64String(encryptedText);
        for (int i = 0; i < bytes.Length; i++)
        {
            bytes[i] ^= 0x5A; // Same XOR key
        }
        return System.Text.Encoding.UTF8.GetString(bytes);
    }
}
```

---

## ⚡ Performance Optimization

### Object Pooling

```csharp
public class ObjectPool : MonoBehaviour
{
    public static ObjectPool Instance { get; private set; }

    [System.Serializable]
    public class Pool
    {
        public string tag;
        public GameObject prefab;
        public int size;
    }

    public List<Pool> pools;
    private Dictionary<string, Queue<GameObject>> poolDictionary;

    private void Awake()
    {
        Instance = this;
        InitializePools();
    }

    private void InitializePools()
    {
        poolDictionary = new Dictionary<string, Queue<GameObject>>();

        foreach (Pool pool in pools)
        {
            Queue<GameObject> objectPool = new Queue<GameObject>();

            for (int i = 0; i < pool.size; i++)
            {
                GameObject obj = Instantiate(pool.prefab);
                obj.SetActive(false);
                objectPool.Enqueue(obj);
            }

            poolDictionary.Add(pool.tag, objectPool);
        }
    }

    public GameObject SpawnFromPool(string tag, Vector3 position, Quaternion rotation)
    {
        if (!poolDictionary.ContainsKey(tag))
        {
            Debug.LogWarning($"Pool with tag {tag} doesn't exist!");
            return null;
        }

        GameObject objectToSpawn = poolDictionary[tag].Dequeue();

        objectToSpawn.SetActive(true);
        objectToSpawn.transform.position = position;
        objectToSpawn.transform.rotation = rotation;

        poolDictionary[tag].Enqueue(objectToSpawn);

        return objectToSpawn;
    }

    public Ball GetBall()
    {
        return SpawnFromPool("Ball", Vector3.zero, Quaternion.identity).GetComponent<Ball>();
    }
}
```

### Memory Management

```csharp
public class MemoryManager : MonoBehaviour
{
    [Header("Settings")]
    public float cleanupInterval = 30f; // seconds
    public int maxCachedObjects = 100;

    private float lastCleanupTime;

    private void Update()
    {
        if (Time.time - lastCleanupTime > cleanupInterval)
        {
            PerformCleanup();
            lastCleanupTime = Time.time;
        }
    }

    private void PerformCleanup()
    {
        // Unload unused assets
        Resources.UnloadUnusedAssets();

        // Force garbage collection if memory usage is high
        if (GetMemoryUsageMB() > 300f)
        {
            System.GC.Collect();
        }
    }

    private float GetMemoryUsageMB()
    {
        return (float)System.GC.GetTotalMemory(false) / 1048576f;
    }

    private void OnApplicationPause(bool pause)
    {
        if (pause)
        {
            // Aggressive cleanup when app is backgrounded
            Resources.UnloadUnusedAssets();
            System.GC.Collect();
        }
    }
}
```

---

## 📱 Platform-Specific Considerations

### iOS Integration

```csharp
#if UNITY_IOS
using UnityEngine.iOS;

public class iOSIntegration : MonoBehaviour
{
    private void Start()
    {
        // Request notification permissions
        UnityEngine.iOS.NotificationServices.RegisterForNotifications(
            NotificationType.Alert |
            NotificationType.Badge |
            NotificationType.Sound
        );

        // Haptic feedback support
        SetupHaptics();
    }

    public void TriggerHaptic(HapticType type)
    {
        switch (type)
        {
            case HapticType.Light:
                Handheld.Vibrate(); // Light vibration
                break;
            case HapticType.Medium:
                Handheld.Vibrate();
                break;
            case HapticType.Heavy:
                Handheld.Vibrate();
                break;
        }
    }
}
#endif
```

### Android Integration

```csharp
#if UNITY_ANDROID
using UnityEngine.Android;

public class AndroidIntegration : MonoBehaviour
{
    private AndroidJavaObject vibrator;

    private void Start()
    {
        // Get vibrator service
        AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
        AndroidJavaObject currentActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity");
        vibrator = currentActivity.Call<AndroidJavaObject>("getSystemService", "vibrator");

        // Request permissions
        if (!Permission.HasUserAuthorizedPermission(Permission.ExternalStorageWrite))
        {
            Permission.RequestUserPermission(Permission.ExternalStorageWrite);
        }
    }

    public void TriggerVibration(long milliseconds)
    {
        vibrator.Call("vibrate", milliseconds);
    }
}
#endif
```

---

## 🎯 Summary

This technical architecture provides:

1. **Modular Design** - Easy to extend and maintain
2. **Performance Optimized** - Object pooling, memory management
3. **Mobile-First** - Touch controls, platform integration
4. **Scalable** - Add new characters, stadiums, modes easily
5. **Data-Driven** - ScriptableObjects for easy content creation
6. **Cross-Platform** - Unified codebase for iOS/Android

**Next Steps:**
1. Implement remaining game systems (fielding, base running, AI)
2. Create character and stadium assets
3. Build UI/UX systems
4. Integrate audio
5. Implement progression and unlock systems
6. Testing and optimization

---

*Ready to build a championship mobile baseball game!* ⚾🔥
