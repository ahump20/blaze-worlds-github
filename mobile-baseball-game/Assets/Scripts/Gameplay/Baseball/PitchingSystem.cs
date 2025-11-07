using UnityEngine;
using System;
using System.Collections;
using BackyardBlazeBaseball.Core;
using BackyardBlazeBaseball.Characters;

namespace BackyardBlazeBaseball.Gameplay.Baseball
{
    /// <summary>
    /// Handles all pitching mechanics - pitch selection, targeting, throwing, and physics
    /// </summary>
    public class PitchingSystem : MonoBehaviour
    {
        [Header("Current State")]
        [SerializeField] private PlayerController currentPitcher;
        [SerializeField] private PitchType selectedPitch = PitchType.Fastball;
        [SerializeField] private Vector2 targetLocation; // Normalized -1 to 1 for strike zone
        [SerializeField] private bool isPitching = false;

        [Header("Pitch Settings")]
        [SerializeField] private float basePitchSpeed = 20f;
        [SerializeField] private float fastballSpeed = 1.0f;
        [SerializeField] private float curveballSpeed = 0.8f;
        [SerializeField] private float changeupSpeed = 0.7f;
        [SerializeField] private float knuckleballSpeed = 0.75f;

        [Header("Control Settings")]
        [SerializeField] private float perfectControlRange = 0.1f;
        [SerializeField] private float goodControlRange = 0.3f;

        [Header("Strike Zone")]
        [SerializeField] private Transform homePlate;
        [SerializeField] private float strikeZoneWidth = 0.6f;
        [SerializeField] private float strikeZoneHeight = 0.8f;
        [SerializeField] private float strikeZoneYOffset = 0.8f;

        [Header("Animation Curves")]
        [SerializeField] private AnimationCurve fastballCurve;
        [SerializeField] private AnimationCurve curveballCurve;
        [SerializeField] private AnimationCurve changeupCurve;
        [SerializeField] private AnimationCurve knuckleballCurve;

        [Header("References")]
        [SerializeField] private ObjectPool objectPool;
        [SerializeField] private AudioManager audioManager;

        private Ball currentBall;
        private Coroutine pitchCoroutine;

        // Events
        public event Action<PitchType> OnPitchSelected;
        public event Action<Vector2> OnTargetSet;
        public event Action<PitchType, Vector2> OnPitchThrown;
        public event Action<Vector2, bool> OnPitchComplete; // location, isStrike

        private void Start()
        {
            InitializeSystem();
        }

        private void InitializeSystem()
        {
            // Find references if not assigned
            if (objectPool == null)
                objectPool = FindObjectOfType<ObjectPool>();

            if (audioManager == null)
                audioManager = GameManager.Instance?.GetAudioManager();

            if (homePlate == null)
                homePlate = GameObject.Find("HomePlate")?.transform;

            // Initialize animation curves if empty
            InitializeAnimationCurves();

            Debug.Log("[PitchingSystem] Initialized");
        }

        private void InitializeAnimationCurves()
        {
            // Fastball - straight trajectory
            if (fastballCurve == null || fastballCurve.length == 0)
            {
                fastballCurve = AnimationCurve.Linear(0f, 0f, 1f, 0f);
            }

            // Curveball - drops at end
            if (curveballCurve == null || curveballCurve.length == 0)
            {
                curveballCurve = new AnimationCurve(
                    new Keyframe(0f, 0f),
                    new Keyframe(0.6f, 0.1f),
                    new Keyframe(1f, 1f)
                );
            }

            // Changeup - slight drop
            if (changeupCurve == null || changeupCurve.length == 0)
            {
                changeupCurve = new AnimationCurve(
                    new Keyframe(0f, 0f),
                    new Keyframe(0.8f, 0.2f),
                    new Keyframe(1f, 0.5f)
                );
            }

            // Knuckleball - unpredictable
            if (knuckleballCurve == null || knuckleballCurve.length == 0)
            {
                knuckleballCurve = AnimationCurve.EaseInOut(0f, 0f, 1f, 1f);
            }
        }

        #region Pitcher Setup
        public void SetPitcher(PlayerController pitcher)
        {
            currentPitcher = pitcher;

            if (pitcher != null)
            {
                basePitchSpeed = pitcher.stats.pitchSpeed * 2f;
                Debug.Log($"[PitchingSystem] Pitcher set: {pitcher.data.characterName} (Speed: {pitcher.stats.pitchSpeed})");
            }
        }

        public PlayerController GetCurrentPitcher()
        {
            return currentPitcher;
        }
        #endregion

        #region Pitch Selection
        public void SelectPitch(PitchType pitchType)
        {
            if (isPitching)
            {
                Debug.LogWarning("[PitchingSystem] Cannot change pitch while pitching");
                return;
            }

            selectedPitch = pitchType;
            OnPitchSelected?.Invoke(pitchType);

            // Play UI sound
            audioManager?.PlaySFX("UI_Select");

            Debug.Log($"[PitchingSystem] Pitch selected: {pitchType}");
        }

        public PitchType GetSelectedPitch()
        {
            return selectedPitch;
        }
        #endregion

        #region Targeting
        public void SetTargetLocation(Vector2 location)
        {
            // Clamp to strike zone bounds
            targetLocation = new Vector2(
                Mathf.Clamp(location.x, -1.5f, 1.5f),
                Mathf.Clamp(location.y, -1.5f, 1.5f)
            );

            OnTargetSet?.Invoke(targetLocation);
        }

        public Vector2 GetTargetLocation()
        {
            return targetLocation;
        }

        public bool IsInStrikeZone(Vector2 location)
        {
            return Mathf.Abs(location.x) <= 1f && Mathf.Abs(location.y) <= 1f;
        }
        #endregion

        #region Pitching
        public void ThrowPitch()
        {
            if (isPitching)
            {
                Debug.LogWarning("[PitchingSystem] Already pitching!");
                return;
            }

            if (currentPitcher == null)
            {
                Debug.LogError("[PitchingSystem] No pitcher assigned!");
                return;
            }

            isPitching = true;

            // Calculate actual pitch location with control stat
            Vector2 actualLocation = CalculateActualLocation();

            // Create ball
            currentBall = objectPool?.GetBall();
            if (currentBall == null)
            {
                Debug.LogError("[PitchingSystem] Failed to get ball from pool!");
                isPitching = false;
                return;
            }

            // Position ball at pitcher's hand
            Vector3 startPos = currentPitcher.transform.position + Vector3.up * 1.5f;
            currentBall.transform.position = startPos;

            // Trigger pitcher animation
            currentPitcher.animator?.SetTrigger("Pitch");

            // Start pitch animation
            pitchCoroutine = StartCoroutine(AnimatePitch(actualLocation));

            // Play sound
            audioManager?.PlaySFX("Pitch_Throw");

            OnPitchThrown?.Invoke(selectedPitch, actualLocation);

            Debug.Log($"[PitchingSystem] Threw {selectedPitch} to {actualLocation}");
        }

        private Vector2 CalculateActualLocation()
        {
            if (currentPitcher == null)
                return targetLocation;

            // Control stat affects accuracy (1-10 scale)
            float controlAccuracy = currentPitcher.stats.pitchControl / 10f;

            // Perfect control (10) = no deviation
            // Poor control (1) = large deviation
            float maxDeviation = Mathf.Lerp(0.5f, 0.05f, controlAccuracy);

            Vector2 randomOffset = new Vector2(
                UnityEngine.Random.Range(-maxDeviation, maxDeviation),
                UnityEngine.Random.Range(-maxDeviation, maxDeviation)
            );

            return targetLocation + randomOffset;
        }

        private IEnumerator AnimatePitch(Vector2 targetPos)
        {
            if (currentBall == null)
            {
                Debug.LogError("[PitchingSystem] Ball is null in AnimatePitch!");
                isPitching = false;
                yield break;
            }

            Vector3 startPos = currentBall.transform.position;
            Vector3 endPos = GetStrikeZoneWorldPosition(targetPos);

            // Calculate duration based on pitch speed
            float speedMultiplier = GetPitchSpeedMultiplier(selectedPitch);
            float duration = 1f / (basePitchSpeed * speedMultiplier / 20f);

            // Get pitch movement
            Vector3 movementOffset = GetPitchMovement(selectedPitch);
            AnimationCurve curve = GetPitchCurve(selectedPitch);

            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;

                // Base trajectory
                Vector3 position = Vector3.Lerp(startPos, endPos, t);

                // Apply pitch-specific movement
                float curveValue = curve.Evaluate(t);
                position += movementOffset * curveValue;

                currentBall.transform.position = position;

                yield return null;
            }

            // Final position
            currentBall.transform.position = endPos;

            // Check if strike or ball
            bool isStrike = IsInStrikeZone(targetPos);

            // Complete pitch
            CompletePitch(targetPos, isStrike);
        }

        private void CompletePitch(Vector2 location, bool isStrike)
        {
            isPitching = false;

            OnPitchComplete?.Invoke(location, isStrike);

            Debug.Log($"[PitchingSystem] Pitch complete at {location} - {(isStrike ? "Strike" : "Ball")}");
        }
        #endregion

        #region Pitch Physics
        private float GetPitchSpeedMultiplier(PitchType type)
        {
            return type switch
            {
                PitchType.Fastball => fastballSpeed,
                PitchType.Curveball => curveballSpeed,
                PitchType.Changeup => changeupSpeed,
                PitchType.Knuckleball => knuckleballSpeed,
                _ => 1.0f
            };
        }

        private Vector3 GetPitchMovement(PitchType type)
        {
            switch (type)
            {
                case PitchType.Fastball:
                    return Vector3.zero; // Straight

                case PitchType.Curveball:
                    // Breaks down and away
                    return new Vector3(0.5f, -1.2f, 0);

                case PitchType.Changeup:
                    // Slight drop
                    return Vector3.down * 0.4f;

                case PitchType.Knuckleball:
                    // Random movement
                    return new Vector3(
                        UnityEngine.Random.Range(-0.8f, 0.8f),
                        UnityEngine.Random.Range(-0.8f, 0.8f),
                        0
                    );

                default:
                    return Vector3.zero;
            }
        }

        private AnimationCurve GetPitchCurve(PitchType type)
        {
            return type switch
            {
                PitchType.Fastball => fastballCurve,
                PitchType.Curveball => curveballCurve,
                PitchType.Changeup => changeupCurve,
                PitchType.Knuckleball => knuckleballCurve,
                _ => AnimationCurve.Linear(0, 0, 1, 0)
            };
        }

        private Vector3 GetStrikeZoneWorldPosition(Vector2 normalizedPos)
        {
            if (homePlate == null)
            {
                Debug.LogError("[PitchingSystem] Home plate not found!");
                return Vector3.zero;
            }

            Vector3 platePos = homePlate.position;

            return platePos + new Vector3(
                normalizedPos.x * (strikeZoneWidth / 2f),
                strikeZoneYOffset + normalizedPos.y * (strikeZoneHeight / 2f),
                0
            );
        }
        #endregion

        #region Utility
        public bool IsPitching()
        {
            return isPitching;
        }

        public void CancelPitch()
        {
            if (pitchCoroutine != null)
            {
                StopCoroutine(pitchCoroutine);
                pitchCoroutine = null;
            }

            if (currentBall != null)
            {
                objectPool?.ReturnBall(currentBall);
                currentBall = null;
            }

            isPitching = false;

            Debug.Log("[PitchingSystem] Pitch cancelled");
        }
        #endregion

        private void OnDrawGizmos()
        {
            if (homePlate == null)
                return;

            // Draw strike zone
            Gizmos.color = Color.yellow;
            Vector3 center = homePlate.position + Vector3.up * strikeZoneYOffset;
            Gizmos.DrawWireCube(center, new Vector3(strikeZoneWidth, strikeZoneHeight, 0.1f));

            // Draw target location
            if (Application.isPlaying)
            {
                Gizmos.color = IsInStrikeZone(targetLocation) ? Color.green : Color.red;
                Vector3 targetWorld = GetStrikeZoneWorldPosition(targetLocation);
                Gizmos.DrawSphere(targetWorld, 0.05f);
            }
        }
    }

    #region Enums
    public enum PitchType
    {
        Fastball,
        Curveball,
        Changeup,
        Knuckleball
    }
    #endregion
}
