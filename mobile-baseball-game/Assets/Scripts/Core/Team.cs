using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using BackyardBlazeBaseball.Characters;

namespace BackyardBlazeBaseball.Core
{
    /// <summary>
    /// Represents a baseball team with roster, lineup, and team stats
    /// </summary>
    [CreateAssetMenu(fileName = "New Team", menuName = "Backyard Blaze/Team")]
    public class TeamSO : ScriptableObject
    {
        [Header("Team Identity")]
        public string teamID;
        public string teamName;
        [TextArea(2, 4)]
        public string description;

        [Header("Visuals")]
        public Sprite logo;
        public Color primaryColor = Color.blue;
        public Color secondaryColor = Color.white;
        public string uniformStyle = "Baseball";

        [Header("Home Stadium")]
        public StadiumData homeStadium;

        [Header("Default Roster")]
        public List<PlayerDataSO> defaultRoster = new List<PlayerDataSO>();

        public Team ToTeam()
        {
            Team team = new Team
            {
                teamID = this.teamID,
                teamName = this.teamName,
                description = this.description,
                primaryColor = this.primaryColor,
                secondaryColor = this.secondaryColor,
                homeStadium = this.homeStadium,
                roster = new List<PlayerData>()
            };

            // Convert default roster
            foreach (var playerSO in defaultRoster)
            {
                if (playerSO != null)
                {
                    team.roster.Add(playerSO.ToPlayerData());
                }
            }

            return team;
        }
    }

    [System.Serializable]
    public class Team
    {
        public string teamID;
        public string teamName;
        public string description;

        public Color primaryColor;
        public Color secondaryColor;

        public StadiumData homeStadium;

        public List<PlayerData> roster = new List<PlayerData>();
        public BattingLineup battingLineup;
        public FieldingLineup fieldingLineup;

        public TeamStats stats;

        // Current game state
        public int currentBatterIndex = 0;

        #region Roster Management
        public void AddPlayer(PlayerData player)
        {
            if (roster.Count >= 12)
            {
                Debug.LogWarning($"[Team] Roster full for {teamName}");
                return;
            }

            roster.Add(player);
            Debug.Log($"[Team] Added {player.characterName} to {teamName}");
        }

        public void RemovePlayer(PlayerData player)
        {
            roster.Remove(player);
            Debug.Log($"[Team] Removed {player.characterName} from {teamName}");
        }

        public bool HasPlayer(string characterID)
        {
            return roster.Any(p => p.characterID == characterID);
        }

        public PlayerData GetPlayer(string characterID)
        {
            return roster.FirstOrDefault(p => p.characterID == characterID);
        }

        public List<PlayerData> GetAvailablePlayers(PlayerPosition position)
        {
            return roster.Where(p => p.CanPlayPosition(position)).ToList();
        }
        #endregion

        #region Lineup Management
        public void SetBattingLineup(List<PlayerData> lineup)
        {
            if (lineup.Count != 9)
            {
                Debug.LogError($"[Team] Batting lineup must have 9 players!");
                return;
            }

            battingLineup = new BattingLineup(lineup);
            Debug.Log($"[Team] Set batting lineup for {teamName}");
        }

        public void SetFieldingLineup(Dictionary<PlayerPosition, PlayerData> positions)
        {
            fieldingLineup = new FieldingLineup(positions);
            Debug.Log($"[Team] Set fielding lineup for {teamName}");
        }

        public PlayerController GetNextBatter()
        {
            if (battingLineup == null || battingLineup.lineup.Count == 0)
            {
                Debug.LogError($"[Team] No batting lineup set for {teamName}!");
                return null;
            }

            PlayerData batter = battingLineup.GetBatter(currentBatterIndex);
            currentBatterIndex = (currentBatterIndex + 1) % battingLineup.lineup.Count;

            // Find or create PlayerController
            GameObject batterObj = GameObject.Find(batter.characterName);
            return batterObj?.GetComponent<PlayerController>();
        }

        public PlayerController GetPitcher()
        {
            if (fieldingLineup == null)
            {
                Debug.LogError($"[Team] No fielding lineup set for {teamName}!");
                return null;
            }

            PlayerData pitcher = fieldingLineup.GetPlayer(PlayerPosition.Pitcher);

            if (pitcher == null)
            {
                Debug.LogError($"[Team] No pitcher assigned for {teamName}!");
                return null;
            }

            // Find or create PlayerController
            GameObject pitcherObj = GameObject.Find(pitcher.characterName);
            return pitcherObj?.GetComponent<PlayerController>();
        }

        public PlayerController GetFielder(PlayerPosition position)
        {
            if (fieldingLineup == null)
                return null;

            PlayerData fielder = fieldingLineup.GetPlayer(position);

            if (fielder == null)
                return null;

            GameObject fielderObj = GameObject.Find(fielder.characterName);
            return fielderObj?.GetComponent<PlayerController>();
        }
        #endregion

        #region Stats Management
        public void RecordWin()
        {
            stats.wins++;
        }

        public void RecordLoss()
        {
            stats.losses++;
        }

        public void RecordRun()
        {
            stats.runs++;
        }

        public void RecordHit()
        {
            stats.hits++;
        }

        public float GetWinPercentage()
        {
            int totalGames = stats.wins + stats.losses;
            return totalGames > 0 ? (float)stats.wins / totalGames : 0f;
        }
        #endregion

        #region Utility
        public int GetRosterSize()
        {
            return roster.Count;
        }

        public int GetAverageLevel()
        {
            if (roster.Count == 0)
                return 1;

            return Mathf.RoundToInt(roster.Average(p => p.level));
        }

        public int GetTeamOverall()
        {
            if (roster.Count == 0)
                return 0;

            return Mathf.RoundToInt(roster.Average(p => p.currentStats.GetOverall()));
        }
        #endregion
    }

    [System.Serializable]
    public class BattingLineup
    {
        public List<PlayerData> lineup;

        public BattingLineup(List<PlayerData> players)
        {
            lineup = new List<PlayerData>(players);
        }

        public PlayerData GetBatter(int index)
        {
            if (lineup.Count == 0)
                return null;

            return lineup[index % lineup.Count];
        }

        public void SwapPositions(int index1, int index2)
        {
            if (index1 < 0 || index1 >= lineup.Count || index2 < 0 || index2 >= lineup.Count)
            {
                Debug.LogError("[BattingLineup] Invalid swap indices!");
                return;
            }

            PlayerData temp = lineup[index1];
            lineup[index1] = lineup[index2];
            lineup[index2] = temp;
        }
    }

    [System.Serializable]
    public class FieldingLineup
    {
        public Dictionary<PlayerPosition, PlayerData> positions;

        public FieldingLineup(Dictionary<PlayerPosition, PlayerData> fieldingPositions)
        {
            positions = new Dictionary<PlayerPosition, PlayerData>(fieldingPositions);
        }

        public PlayerData GetPlayer(PlayerPosition position)
        {
            return positions.ContainsKey(position) ? positions[position] : null;
        }

        public void SetPlayer(PlayerPosition position, PlayerData player)
        {
            if (!player.CanPlayPosition(position))
            {
                Debug.LogWarning($"[FieldingLineup] {player.characterName} cannot play {position}!");
                return;
            }

            positions[position] = player;
        }

        public bool IsPositionFilled(PlayerPosition position)
        {
            return positions.ContainsKey(position) && positions[position] != null;
        }

        public bool AllPositionsFilled()
        {
            PlayerPosition[] requiredPositions = System.Enum.GetValues(typeof(PlayerPosition)) as PlayerPosition[];

            foreach (var position in requiredPositions)
            {
                if (!IsPositionFilled(position))
                    return false;
            }

            return true;
        }
    }

    [System.Serializable]
    public class TeamStats
    {
        public int wins;
        public int losses;
        public int runs;
        public int hits;
        public int homeRuns;
        public int errors;
        public int strikeouts;

        public void Reset()
        {
            wins = 0;
            losses = 0;
            runs = 0;
            hits = 0;
            homeRuns = 0;
            errors = 0;
            strikeouts = 0;
        }
    }

    [System.Serializable]
    public class StadiumData
    {
        public string stadiumID;
        public string stadiumName;
        [TextArea(2, 4)]
        public string description;

        public Sprite previewImage;
        public GameObject stadiumPrefab;

        public Vector2 dimensions; // Width x depth
        public StadiumType type;

        public bool hasSpecialFeatures;
        [TextArea(2, 3)]
        public string specialFeatureDescription;

        public bool isUnlocked;
    }

    public enum StadiumType
    {
        Suburban,
        Beach,
        Desert,
        Snow,
        Urban,
        Forest,
        Carnival,
        Farm,
        Space,
        Prehistoric,
        Retro,
        Castle
    }
}
