using UnityEngine;
using System;
using System.Collections;
using BackyardBlazeBaseball.Core;
using BackyardBlazeBaseball.Characters;

namespace BackyardBlazeBaseball.Gameplay.Baseball
{
    /// <summary>
    /// Handles all batting mechanics - swing timing, contact detection, and hit physics
    /// </summary>
    public class BattingSystem : MonoBehaviour
    {
        [Header("Current State")]
        [SerializeField] private PlayerController currentBatter;
        [SerializeField] private bool isSwinging = false;
        [SerializeField] private float swingStartTime;
        [SerializeField] private int strikes = 0;
        [SerializeField] private int balls = 0;

        [Header("Timing Windows")]
        [SerializeField] private float perfectTimingWindow = 0.08f;
        [SerializeField] private float goodTimingWindow = 0.15f;
        [SerializeField] private float okayTimingWindow = 0.25f;

        [Header("Hit Physics")]
        [SerializeField] private float basePower = 15f;
        [SerializeField] private float launchAngleMin = 10f;
        [SerializeField] private float launchAngleMax = 45f;
        [SerializeField] private float hitDirectionVariance = 30f;

        [Header("Swing Settings")]
        [SerializeField] private float swingDuration = 0.3f;
        [SerializeField] private float optimalContactTime = 0.15f; // Time in swing for best contact

        [Header("References")]
        [SerializeField] private PitchingSystem pitchingSystem;
        [SerializeField] private FieldingSystem fieldingSystem;
        [SerializeField] private ObjectPool objectPool;
        [SerializeField] private AudioManager audioManager;

        [Header("Contact Detection")]
        [SerializeField] private Transform batTransform;
        [SerializeField] private float contactRadius = 0.3f;

        // Events
        public event Action OnSwingStarted;
        public event Action<ContactQuality> OnContact;
        public event Action OnSwingMiss;
        public event Action<bool> OnStrike; // called or swinging
        public event Action OnBall;
        public event Action OnFoulBall;
        public event Action<HitType> OnHit;

        private Coroutine swingCoroutine;
        private bool canSwing = true;

        private void Start()
        {
            InitializeSystem();
        }

        private void InitializeSystem()
        {
            // Find references
            if (pitchingSystem == null)
                pitchingSystem = FindObjectOfType<PitchingSystem>();

            if (fieldingSystem == null)
                fieldingSystem = FindObjectOfType<FieldingSystem>();

            if (objectPool == null)
                objectPool = FindObjectOfType<ObjectPool>();

            if (audioManager == null)
                audioManager = GameManager.Instance?.GetAudioManager();

            // Subscribe to pitch events
            if (pitchingSystem != null)
                pitchingSystem.OnPitchComplete += HandlePitchArrival;

            Debug.Log("[BattingSystem] Initialized");
        }

        #region Batter Setup
        public void SetBatter(PlayerController batter)
        {
            currentBatter = batter;

            if (batter != null)
            {
                basePower = batter.stats.power * 1.5f;

                // Adjust timing windows based on contact stat
                float contactModifier = batter.stats.contact / 10f;
                perfectTimingWindow = 0.08f + (contactModifier * 0.04f);
                goodTimingWindow = 0.15f + (contactModifier * 0.08f);

                Debug.Log($"[BattingSystem] Batter set: {batter.data.characterName} (Power: {batter.stats.power}, Contact: {batter.stats.contact})");
            }

            // Reset count
            strikes = 0;
            balls = 0;
        }

        public PlayerController GetCurrentBatter()
        {
            return currentBatter;
        }
        #endregion

        #region Swing Mechanics
        public void StartSwing()
        {
            if (!canSwing || isSwinging)
            {
                Debug.LogWarning("[BattingSystem] Cannot swing right now");
                return;
            }

            if (currentBatter == null)
            {
                Debug.LogError("[BattingSystem] No batter assigned!");
                return;
            }

            isSwinging = true;
            canSwing = false;
            swingStartTime = Time.time;

            // Trigger animation
            currentBatter.animator?.SetTrigger("Swing");

            // Play swing sound
            audioManager?.PlaySFX("Bat_Swing");

            OnSwingStarted?.Invoke();

            // Start swing coroutine
            swingCoroutine = StartCoroutine(SwingCoroutine());

            Debug.Log("[BattingSystem] Swing started");
        }

        private IEnumerator SwingCoroutine()
        {
            yield return new WaitForSeconds(swingDuration);

            isSwinging = false;

            // Allow next swing after cooldown
            yield return new WaitForSeconds(0.2f);
            canSwing = true;
        }

        public bool CanSwing()
        {
            return canSwing && !isSwinging;
        }

        public bool IsSwinging()
        {
            return isSwinging;
        }
        #endregion

        #region Contact Detection
        private void HandlePitchArrival(Vector2 pitchLocation, bool isStrike)
        {
            if (!isSwinging)
            {
                // Didn't swing
                if (isStrike)
                {
                    // Called strike
                    AddStrike(false);
                }
                else
                {
                    // Ball
                    AddBall();
                }
                return;
            }

            // Calculate timing quality
            float swingElapsed = Time.time - swingStartTime;
            float timingDiff = Mathf.Abs(swingElapsed - optimalContactTime);

            ContactQuality contactQuality = DetermineContactQuality(timingDiff);

            if (contactQuality == ContactQuality.Miss)
            {
                // Swinging strike
                AddStrike(true);
                OnSwingMiss?.Invoke();
                audioManager?.PlaySFX("Bat_Miss");
            }
            else
            {
                // Made contact!
                ProcessHit(pitchLocation, contactQuality);
            }
        }

        private ContactQuality DetermineContactQuality(float timingDiff)
        {
            if (timingDiff <= perfectTimingWindow)
                return ContactQuality.Perfect;
            else if (timingDiff <= goodTimingWindow)
                return ContactQuality.Good;
            else if (timingDiff <= okayTimingWindow)
                return ContactQuality.Okay;
            else
                return ContactQuality.Miss;
        }
        #endregion

        #region Hit Processing
        private void ProcessHit(Vector2 pitchLocation, ContactQuality quality)
        {
            OnContact?.Invoke(quality);

            // Calculate hit parameters
            float powerMultiplier = quality switch
            {
                ContactQuality.Perfect => 1.0f,
                ContactQuality.Good => 0.75f,
                ContactQuality.Okay => 0.5f,
                _ => 0.3f
            };

            float hitPower = basePower * powerMultiplier * (currentBatter.stats.power / 10f);
            float launchAngle = CalculateLaunchAngle(pitchLocation, quality);
            float direction = CalculateHitDirection(pitchLocation, quality);

            // Determine hit type
            HitType hitType = DetermineHitType(launchAngle, hitPower, direction);

            // Check if foul ball
            if (IsFoulBall(direction))
            {
                HandleFoulBall();
                return;
            }

            // Launch ball
            LaunchBall(hitPower, launchAngle, direction);

            // Play appropriate sound
            PlayHitSound(quality);

            OnHit?.Invoke(hitType);

            Debug.Log($"[BattingSystem] Hit! Type: {hitType}, Power: {hitPower:F1}, Angle: {launchAngle:F1}°, Direction: {direction:F1}°");
        }

        private float CalculateLaunchAngle(Vector2 pitchLocation, ContactQuality quality)
        {
            // High pitches tend to produce pop-ups
            // Low pitches tend to produce ground balls
            float baseAngle = Mathf.Lerp(launchAngleMin, launchAngleMax, (pitchLocation.y + 1.5f) / 3f);

            // Perfect contact gets optimal angle
            if (quality == ContactQuality.Perfect)
            {
                baseAngle = 25f; // Optimal line drive angle
            }
            else if (quality == ContactQuality.Good)
            {
                baseAngle += UnityEngine.Random.Range(-10f, 10f);
            }
            else
            {
                baseAngle += UnityEngine.Random.Range(-20f, 20f);
            }

            return Mathf.Clamp(baseAngle, launchAngleMin, launchAngleMax + 20f);
        }

        private float CalculateHitDirection(Vector2 pitchLocation, ContactQuality quality)
        {
            // Inside pitches = pulled
            // Outside pitches = opposite field
            float baseDirection = pitchLocation.x * hitDirectionVariance;

            // Add randomness based on quality
            if (quality != ContactQuality.Perfect)
            {
                baseDirection += UnityEngine.Random.Range(-15f, 15f);
            }

            return Mathf.Clamp(baseDirection, -90f, 90f);
        }

        private HitType DetermineHitType(float launchAngle, float power, float direction)
        {
            if (launchAngle < 15f)
            {
                return HitType.GroundBall;
            }
            else if (launchAngle < 25f)
            {
                return power > 20f ? HitType.LineDrive : HitType.GroundBall;
            }
            else if (launchAngle < 40f)
            {
                return power > 25f ? HitType.HomeRun : HitType.FlyBall;
            }
            else
            {
                return HitType.PopFly;
            }
        }

        private bool IsFoulBall(float direction)
        {
            // Balls hit beyond ±45° are foul
            return Mathf.Abs(direction) > 45f;
        }

        private void HandleFoulBall()
        {
            // Foul ball counts as strike (except on 2 strikes)
            if (strikes < 2)
            {
                AddStrike(true);
            }

            audioManager?.PlaySFX("Bat_Hit_Foul");
            OnFoulBall?.Invoke();

            Debug.Log("[BattingSystem] Foul ball!");
        }

        private void LaunchBall(float power, float launchAngle, float direction)
        {
            Ball ball = pitchingSystem?.GetComponent<PitchingSystem>()?.GetCurrentBall();

            if (ball == null)
            {
                ball = objectPool?.GetBall();
            }

            if (ball == null)
            {
                Debug.LogError("[BattingSystem] No ball available!");
                return;
            }

            // Calculate launch velocity
            Vector3 launchDirection = Quaternion.Euler(-launchAngle, direction, 0) * Vector3.forward;
            Vector3 velocity = launchDirection * power;

            // Apply velocity
            Rigidbody ballRb = ball.GetComponent<Rigidbody>();
            if (ballRb != null)
            {
                ballRb.velocity = velocity;
                ballRb.useGravity = true;
                ballRb.drag = 0.02f; // Air resistance
            }

            // Notify fielding system
            fieldingSystem?.OnBallHit(ball, velocity);
        }

        private void PlayHitSound(ContactQuality quality)
        {
            string soundEffect = quality switch
            {
                ContactQuality.Perfect => "Bat_Hit_Perfect",
                ContactQuality.Good => "Bat_Hit_Good",
                ContactQuality.Okay => "Bat_Hit_Weak",
                _ => "Bat_Hit_Weak"
            };

            audioManager?.PlaySFX(soundEffect);
        }
        #endregion

        #region Count Management
        private void AddStrike(bool swinging)
        {
            strikes++;

            if (strikes >= 3)
            {
                // Strikeout!
                HandleStrikeout(swinging);
            }
            else
            {
                OnStrike?.Invoke(swinging);
            }

            Debug.Log($"[BattingSystem] Strike {strikes} ({(swinging ? "swinging" : "called")})");
        }

        private void AddBall()
        {
            balls++;

            if (balls >= 4)
            {
                // Walk!
                HandleWalk();
            }
            else
            {
                OnBall?.Invoke();
            }

            Debug.Log($"[BattingSystem] Ball {balls}");
        }

        private void HandleStrikeout(bool swinging)
        {
            Debug.Log($"[BattingSystem] Strikeout! ({(swinging ? "swinging" : "looking")})");

            audioManager?.PlaySFX(swinging ? "Strikeout_Swinging" : "Strikeout_Looking");

            // Notify match manager
            MatchManager matchManager = FindObjectOfType<MatchManager>();
            matchManager?.RecordOut(OutType.Strikeout);

            // Reset count
            ResetCount();
        }

        private void HandleWalk()
        {
            Debug.Log("[BattingSystem] Walk!");

            audioManager?.PlaySFX("Walk");

            // Notify match manager
            MatchManager matchManager = FindObjectOfType<MatchManager>();
            matchManager?.RecordWalk();

            // Reset count
            ResetCount();
        }

        public void ResetCount()
        {
            strikes = 0;
            balls = 0;
        }

        public int GetStrikes() => strikes;
        public int GetBalls() => balls;
        #endregion

        private void OnDrawGizmos()
        {
            if (batTransform != null)
            {
                // Draw contact zone
                Gizmos.color = Color.cyan;
                Gizmos.DrawWireSphere(batTransform.position, contactRadius);
            }
        }

        private void OnDestroy()
        {
            // Unsubscribe from events
            if (pitchingSystem != null)
                pitchingSystem.OnPitchComplete -= HandlePitchArrival;
        }
    }

    #region Enums
    public enum ContactQuality
    {
        Perfect,
        Good,
        Okay,
        Weak,
        Miss
    }

    public enum HitType
    {
        GroundBall,
        LineDrive,
        FlyBall,
        PopFly,
        HomeRun
    }

    public enum OutType
    {
        Strikeout,
        Groundout,
        Flyout,
        Lineout,
        ForceOut,
        TagOut,
        DoublePlay,
        TriplePlay
    }
    #endregion
}
