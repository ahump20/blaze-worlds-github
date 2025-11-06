using UnityEngine;
using System;

namespace BackyardBlazeBaseball.Input
{
    /// <summary>
    /// Unified touch input system for mobile devices
    /// Handles taps, swipes, holds, and gestures
    /// </summary>
    public class TouchInputManager : MonoBehaviour
    {
        #region Singleton
        public static TouchInputManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }
        #endregion

        [Header("Swipe Settings")]
        [SerializeField] private float swipeThreshold = 50f; // Minimum distance for swipe
        [SerializeField] private float swipeTimeLimit = 0.5f; // Maximum time for swipe

        [Header("Tap Settings")]
        [SerializeField] private float tapMaxDuration = 0.3f;
        [SerializeField] private float tapMaxDistance = 30f;
        [SerializeField] private float doubleTapTimeWindow = 0.3f;

        [Header("Hold Settings")]
        [SerializeField] private float holdDuration = 0.5f;

        [Header("Debug")]
        [SerializeField] private bool showDebugInfo = false;

        // Touch state
        private Vector2 touchStartPos;
        private float touchStartTime;
        private bool isTouching = false;
        private bool isHolding = false;

        // Double tap detection
        private float lastTapTime = 0f;
        private Vector2 lastTapPos;

        // Events
        public event Action<Vector2> OnTouchBegan;
        public event Action<Vector2, Vector2> OnTouchMoved; // position, delta
        public event Action<Vector2> OnTouchEnded;
        public event Action<Vector2> OnTap;
        public event Action<Vector2> OnDoubleTap;
        public event Action<Vector2, SwipeDirection> OnSwipe;
        public event Action<Vector2> OnHoldStarted;
        public event Action<Vector2> OnHoldEnded;

        private void Update()
        {
            ProcessInput();

            // Check for hold
            if (isTouching && !isHolding && Time.time - touchStartTime >= holdDuration)
            {
                isHolding = true;
                OnHoldStarted?.Invoke(touchStartPos);

                if (showDebugInfo)
                    Debug.Log($"[TouchInput] Hold started at {touchStartPos}");
            }
        }

        private void ProcessInput()
        {
            // Mobile touch input
            if (UnityEngine.Input.touchCount > 0)
            {
                HandleTouch(UnityEngine.Input.GetTouch(0));
            }
            // Mouse input for editor testing
            else if (Application.isEditor)
            {
                HandleMouseInput();
            }
        }

        #region Touch Handling
        private void HandleTouch(Touch touch)
        {
            switch (touch.phase)
            {
                case TouchPhase.Began:
                    HandleTouchStart(touch.position);
                    break;

                case TouchPhase.Moved:
                    HandleTouchMove(touch.position);
                    break;

                case TouchPhase.Stationary:
                    // Touch is held but not moving
                    break;

                case TouchPhase.Ended:
                case TouchPhase.Canceled:
                    HandleTouchEnd(touch.position);
                    break;
            }
        }

        private void HandleTouchStart(Vector2 position)
        {
            touchStartPos = position;
            touchStartTime = Time.time;
            isTouching = true;
            isHolding = false;

            OnTouchBegan?.Invoke(position);

            if (showDebugInfo)
                Debug.Log($"[TouchInput] Touch began at {position}");
        }

        private void HandleTouchMove(Vector2 position)
        {
            if (!isTouching)
                return;

            Vector2 delta = position - touchStartPos;

            OnTouchMoved?.Invoke(position, delta);

            // Check for swipe
            if (delta.magnitude >= swipeThreshold)
            {
                float swipeTime = Time.time - touchStartTime;

                if (swipeTime <= swipeTimeLimit)
                {
                    SwipeDirection direction = GetSwipeDirection(delta);
                    OnSwipe?.Invoke(position, direction);

                    if (showDebugInfo)
                        Debug.Log($"[TouchInput] Swipe {direction}");

                    // Reset to prevent multiple swipe triggers
                    touchStartPos = position;
                    touchStartTime = Time.time;
                }
            }
        }

        private void HandleTouchEnd(Vector2 position)
        {
            if (!isTouching)
                return;

            float touchDuration = Time.time - touchStartTime;
            Vector2 delta = position - touchStartPos;

            // Check for tap
            if (touchDuration <= tapMaxDuration && delta.magnitude <= tapMaxDistance)
            {
                OnTap?.Invoke(position);

                // Check for double tap
                if (Time.time - lastTapTime <= doubleTapTimeWindow &&
                    Vector2.Distance(position, lastTapPos) <= tapMaxDistance)
                {
                    OnDoubleTap?.Invoke(position);

                    if (showDebugInfo)
                        Debug.Log($"[TouchInput] Double tap at {position}");

                    lastTapTime = 0f; // Reset to prevent triple tap
                }
                else
                {
                    lastTapTime = Time.time;
                    lastTapPos = position;

                    if (showDebugInfo)
                        Debug.Log($"[TouchInput] Tap at {position}");
                }
            }

            // Check for hold release
            if (isHolding)
            {
                OnHoldEnded?.Invoke(position);

                if (showDebugInfo)
                    Debug.Log($"[TouchInput] Hold ended at {position}");
            }

            isTouching = false;
            isHolding = false;

            OnTouchEnded?.Invoke(position);
        }
        #endregion

        #region Mouse Input (Editor Only)
        private void HandleMouseInput()
        {
            Vector2 mousePos = UnityEngine.Input.mousePosition;

            if (UnityEngine.Input.GetMouseButtonDown(0))
            {
                HandleTouchStart(mousePos);
            }
            else if (UnityEngine.Input.GetMouseButton(0))
            {
                HandleTouchMove(mousePos);
            }
            else if (UnityEngine.Input.GetMouseButtonUp(0))
            {
                HandleTouchEnd(mousePos);
            }
        }
        #endregion

        #region Utility Methods
        private SwipeDirection GetSwipeDirection(Vector2 delta)
        {
            float angle = Mathf.Atan2(delta.y, delta.x) * Mathf.Rad2Deg;

            // Normalize angle to 0-360
            if (angle < 0)
                angle += 360f;

            // Determine direction (8-way)
            if (angle >= 337.5f || angle < 22.5f)
                return SwipeDirection.Right;
            else if (angle >= 22.5f && angle < 67.5f)
                return SwipeDirection.UpRight;
            else if (angle >= 67.5f && angle < 112.5f)
                return SwipeDirection.Up;
            else if (angle >= 112.5f && angle < 157.5f)
                return SwipeDirection.UpLeft;
            else if (angle >= 157.5f && angle < 202.5f)
                return SwipeDirection.Left;
            else if (angle >= 202.5f && angle < 247.5f)
                return SwipeDirection.DownLeft;
            else if (angle >= 247.5f && angle < 292.5f)
                return SwipeDirection.Down;
            else
                return SwipeDirection.DownRight;
        }

        public Vector2 GetCurrentTouchPosition()
        {
            if (UnityEngine.Input.touchCount > 0)
            {
                return UnityEngine.Input.GetTouch(0).position;
            }
            else if (Application.isEditor)
            {
                return UnityEngine.Input.mousePosition;
            }

            return Vector2.zero;
        }

        public bool IsTouching()
        {
            return isTouching;
        }

        public bool IsHolding()
        {
            return isHolding;
        }
        #endregion

        #region Haptic Feedback
        public void TriggerHaptic(HapticType type)
        {
            #if UNITY_IOS || UNITY_ANDROID
            switch (type)
            {
                case HapticType.Light:
                    Handheld.Vibrate();
                    break;

                case HapticType.Medium:
                    Handheld.Vibrate();
                    break;

                case HapticType.Heavy:
                    Handheld.Vibrate();
                    break;

                case HapticType.Success:
                    Handheld.Vibrate();
                    break;

                case HapticType.Error:
                    Handheld.Vibrate();
                    break;
            }
            #endif

            if (showDebugInfo)
                Debug.Log($"[TouchInput] Haptic feedback: {type}");
        }
        #endregion

        private void OnGUI()
        {
            if (!showDebugInfo)
                return;

            GUILayout.BeginArea(new Rect(10, 10, 300, 200));
            GUILayout.Label($"Touch Count: {UnityEngine.Input.touchCount}");
            GUILayout.Label($"Is Touching: {isTouching}");
            GUILayout.Label($"Is Holding: {isHolding}");
            if (isTouching)
            {
                GUILayout.Label($"Touch Start: {touchStartPos}");
                GUILayout.Label($"Touch Duration: {Time.time - touchStartTime:F2}s");
            }
            GUILayout.EndArea();
        }
    }

    #region Enums
    public enum SwipeDirection
    {
        Up,
        UpRight,
        Right,
        DownRight,
        Down,
        DownLeft,
        Left,
        UpLeft
    }

    public enum HapticType
    {
        Light,
        Medium,
        Heavy,
        Success,
        Error
    }
    #endregion
}
