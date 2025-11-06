using UnityEngine;
using System;

namespace BackyardBlazeBaseball.Characters
{
    /// <summary>
    /// Data structure for player characters
    /// Contains stats, abilities, visuals, and career statistics
    /// </summary>
    [CreateAssetMenu(fileName = "New Player", menuName = "Backyard Blaze/Player Data")]
    public class PlayerDataSO : ScriptableObject
    {
        [Header("Identity")]
        public string characterID;
        public string characterName;
        [TextArea(3, 5)]
        public string description;
        public PlayerArchetype archetype;

        [Header("Visuals")]
        public GameObject characterPrefab;
        public Sprite portrait;
        public Sprite iconSmall;
        public Color primaryColor = Color.white;
        public Color secondaryColor = Color.gray;

        [Header("Base Stats")]
        public PlayerStats baseStats;

        [Header("Abilities")]
        public SpecialAbility specialAbility;

        [Header("Positions")]
        public PlayerPosition primaryPosition;
        public PlayerPosition[] secondaryPositions;

        [Header("Progression")]
        public int startingLevel = 1;
        public AnimationCurve xpCurve; // XP required per level

        [Header("Audio")]
        public AudioClip[] voiceLines;
        public AudioClip celebrationSound;

        [Header("Unlock")]
        public bool unlockedByDefault = false;
        public UnlockRequirement unlockRequirement;

        public PlayerData ToPlayerData()
        {
            return new PlayerData
            {
                characterID = this.characterID,
                characterName = this.characterName,
                description = this.description,
                archetype = this.archetype,
                level = this.startingLevel,
                currentXP = 0,
                xpToNextLevel = CalculateXPToNextLevel(startingLevel),
                baseStats = this.baseStats,
                currentStats = this.baseStats,
                specialAbility = this.specialAbility,
                primaryPosition = this.primaryPosition,
                secondaryPositions = this.secondaryPositions,
                primaryColor = this.primaryColor,
                secondaryColor = this.secondaryColor,
                isUnlocked = this.unlockedByDefault,
                gamesPlayed = 0,
                careerStats = new PlayerCareerStats()
            };
        }

        private int CalculateXPToNextLevel(int level)
        {
            if (xpCurve != null && xpCurve.length > 0)
            {
                return Mathf.RoundToInt(xpCurve.Evaluate(level) * 1000f);
            }
            return 100 * level; // Default linear progression
        }
    }

    [System.Serializable]
    public class PlayerData
    {
        public string characterID;
        public string characterName;
        public string description;
        public PlayerArchetype archetype;

        [Header("Level & XP")]
        public int level;
        public int currentXP;
        public int xpToNextLevel;

        [Header("Stats")]
        public PlayerStats baseStats;
        public PlayerStats currentStats; // Base + level bonuses

        [Header("Ability")]
        public SpecialAbility specialAbility;

        [Header("Positions")]
        public PlayerPosition primaryPosition;
        public PlayerPosition[] secondaryPositions;

        [Header("Appearance")]
        public Color primaryColor;
        public Color secondaryColor;

        [Header("Progression")]
        public bool isUnlocked;
        public int gamesPlayed;
        public PlayerCareerStats careerStats;

        public void AddXP(int amount)
        {
            currentXP += amount;

            while (currentXP >= xpToNextLevel && level < 99)
            {
                currentXP -= xpToNextLevel;
                LevelUp();
            }
        }

        private void LevelUp()
        {
            level++;

            // Increase stats slightly
            currentStats = baseStats + GetLevelBonusStats(level);

            Debug.Log($"{characterName} leveled up to level {level}!");
        }

        private PlayerStats GetLevelBonusStats(int level)
        {
            // Each level adds small stat bonuses
            int bonus = level / 5; // +1 to stats every 5 levels
            return new PlayerStats
            {
                power = bonus,
                contact = bonus,
                speed = bonus,
                fielding = bonus,
                armStrength = bonus,
                pitchSpeed = bonus,
                pitchControl = bonus
            };
        }

        public bool CanPlayPosition(PlayerPosition position)
        {
            if (position == primaryPosition)
                return true;

            foreach (var secondaryPos in secondaryPositions)
            {
                if (secondaryPos == position)
                    return true;
            }

            return false;
        }
    }

    [System.Serializable]
    public class PlayerStats
    {
        [Header("Batting")]
        [Range(1, 10)] public int power = 5;
        [Range(1, 10)] public int contact = 5;

        [Header("Running")]
        [Range(1, 10)] public int speed = 5;

        [Header("Fielding")]
        [Range(1, 10)] public int fielding = 5;
        [Range(1, 10)] public int armStrength = 5;

        [Header("Pitching")]
        [Range(1, 10)] public int pitchSpeed = 5;
        [Range(1, 10)] public int pitchControl = 5;

        public int GetOverall()
        {
            return (power + contact + speed + fielding + armStrength + pitchSpeed + pitchControl) / 7;
        }

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
        [Header("Batting")]
        public int atBats;
        public int hits;
        public int doubles;
        public int triples;
        public int homeRuns;
        public int rbis; // Runs batted in
        public int walks;
        public int strikeouts;
        public int stolenBases;

        [Header("Pitching")]
        public int inningsPitched;
        public int strikeoutsPitched;
        public int walksAllowed;
        public int earnedRuns;
        public int wins;
        public int losses;
        public int saves;

        [Header("Fielding")]
        public int putOuts;
        public int assists;
        public int errors;

        // Calculated properties
        public float BattingAverage => atBats > 0 ? (float)hits / atBats : 0f;
        public float SluggingPercentage => atBats > 0 ?
            (float)(hits + doubles + (triples * 2) + (homeRuns * 3)) / atBats : 0f;
        public float OnBasePercentage => (atBats + walks) > 0 ?
            (float)(hits + walks) / (atBats + walks) : 0f;

        public float ERA => inningsPitched > 0 ? (earnedRuns * 9f) / inningsPitched : 0f;
        public float WHIP => inningsPitched > 0 ? (walksAllowed + (atBats - hits)) / (float)inningsPitched : 0f;

        public float FieldingPercentage => (putOuts + assists + errors) > 0 ?
            (float)(putOuts + assists) / (putOuts + assists + errors) : 0f;

        public void RecordAtBat(bool hit, int bases = 1)
        {
            atBats++;

            if (hit)
            {
                hits++;

                switch (bases)
                {
                    case 1: break; // Single
                    case 2: doubles++; break;
                    case 3: triples++; break;
                    case 4: homeRuns++; break;
                }
            }
        }

        public void RecordRBI(int count = 1)
        {
            rbis += count;
        }

        public void RecordStrikeout()
        {
            atBats++;
            strikeouts++;
        }

        public void RecordWalk()
        {
            walks++;
        }

        public void RecordStolenBase()
        {
            stolenBases++;
        }

        public void RecordPitching(int inningsPitched, int strikeouts, int walks, int earnedRuns)
        {
            this.inningsPitched += inningsPitched;
            this.strikeoutsPitched += strikeouts;
            this.walksAllowed += walks;
            this.earnedRuns += earnedRuns;
        }

        public void RecordPitchingResult(bool win)
        {
            if (win)
                wins++;
            else
                losses++;
        }

        public void RecordSave()
        {
            saves++;
        }

        public void RecordFieldingPlay(FieldingPlayType type)
        {
            switch (type)
            {
                case FieldingPlayType.PutOut:
                    putOuts++;
                    break;
                case FieldingPlayType.Assist:
                    assists++;
                    break;
                case FieldingPlayType.Error:
                    errors++;
                    break;
            }
        }
    }

    [System.Serializable]
    public class SpecialAbility
    {
        public string abilityName;
        [TextArea(2, 4)]
        public string description;
        public AbilityType type;
        public float value; // Multiplier or bonus value
        public float duration; // Duration in seconds (0 = permanent)
        public float cooldown; // Cooldown in seconds
        public Sprite icon;

        [NonSerialized]
        public bool isActive;
        [NonSerialized]
        public float cooldownRemaining;

        public void Activate(PlayerController player)
        {
            if (cooldownRemaining > 0)
            {
                Debug.LogWarning($"Ability {abilityName} is on cooldown!");
                return;
            }

            isActive = true;
            cooldownRemaining = cooldown;

            ApplyAbility(player);

            Debug.Log($"Activated ability: {abilityName}");
        }

        private void ApplyAbility(PlayerController player)
        {
            switch (type)
            {
                case AbilityType.PowerBoost:
                    player.stats.power = Mathf.Min(10, player.stats.power + Mathf.RoundToInt(value));
                    break;

                case AbilityType.SpeedBoost:
                    player.stats.speed = Mathf.Min(10, player.stats.speed + Mathf.RoundToInt(value));
                    break;

                case AbilityType.ContactBoost:
                    player.stats.contact = Mathf.Min(10, player.stats.contact + Mathf.RoundToInt(value));
                    break;

                case AbilityType.GuaranteedHit:
                    // Special case - handled by batting system
                    break;

                case AbilityType.PerfectPitch:
                    player.stats.pitchControl = 10;
                    break;

                case AbilityType.StaminaBoost:
                    // Restore stamina (handled by pitcher stamina system)
                    break;
            }
        }

        public void UpdateCooldown(float deltaTime)
        {
            if (cooldownRemaining > 0)
            {
                cooldownRemaining -= deltaTime;
                if (cooldownRemaining <= 0)
                {
                    cooldownRemaining = 0;
                    isActive = false;
                }
            }
        }
    }

    [System.Serializable]
    public class UnlockRequirement
    {
        public UnlockType type;
        public int value; // Games won, level reached, etc.
        public string description;

        public bool IsUnlocked(PlayerProgress progress)
        {
            switch (type)
            {
                case UnlockType.GamesWon:
                    return progress.totalWins >= value;

                case UnlockType.PlayerLevel:
                    return progress.playerLevel >= value;

                case UnlockType.AchievementCompleted:
                    return progress.HasAchievement(description);

                case UnlockType.SeasonCompleted:
                    return progress.seasonsCompleted >= value;

                default:
                    return false;
            }
        }
    }

    #region Enums
    public enum PlayerArchetype
    {
        PowerHitter,
        ContactSpecialist,
        Speedster,
        Ace,
        Balanced,
        ComicRelief
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

    public enum AbilityType
    {
        PowerBoost,
        SpeedBoost,
        ContactBoost,
        GuaranteedHit,
        PerfectPitch,
        StaminaBoost,
        TeamBoost,
        LuckyBreak
    }

    public enum UnlockType
    {
        Default, // Already unlocked
        GamesWon,
        PlayerLevel,
        AchievementCompleted,
        SeasonCompleted,
        Purchase // In-app purchase
    }

    public enum FieldingPlayType
    {
        PutOut,
        Assist,
        Error
    }
    #endregion
}
