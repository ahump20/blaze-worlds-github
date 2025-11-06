# Backyard Blaze Baseball ⚾🔥

**A Mobile Baseball Game Inspired by Classic Backyard Baseball**

100% Original IP • Cross-Platform • Kid-Friendly • Built with Unity

---

## 🎮 About

Backyard Blaze Baseball is a mobile baseball video game that captures the nostalgic, accessible gameplay of classic backyard baseball games while featuring completely original characters, art, audio, and mechanics.

### Key Features

- **30 Unique Original Characters** - Diverse cast with special abilities
- **12 Imaginative Stadiums** - From beaches to space stations
- **Multiple Game Modes** - Quick Play, Season, Tournament, Home Run Derby, Practice
- **Intuitive Touch Controls** - Designed specifically for mobile
- **Deep Progression System** - Level up characters, unlock content
- **Cross-Platform** - iOS and Android support
- **Kid-Friendly** - Colorful, non-violent, appropriate for all ages

---

## 🛠️ Technical Stack

- **Engine:** Unity 2022.3 LTS
- **Language:** C#
- **Platforms:** iOS 13+, Android 8.0+
- **Target Performance:** 60 FPS
- **Art Style:** Colorful cartoon 3D with exaggerated proportions
- **Audio:** Original music and sound effects

---

## 📁 Project Structure

```
mobile-baseball-game/
├── Assets/
│   ├── Scripts/
│   │   ├── Core/               # Game managers, systems
│   │   ├── Gameplay/           # Baseball mechanics
│   │   ├── Characters/         # Player data and controllers
│   │   ├── Input/              # Touch input handling
│   │   ├── UI/                 # User interface
│   │   └── Utilities/          # Helper scripts
│   ├── Art/
│   │   ├── Characters/         # 3D models and textures
│   │   ├── Stadiums/           # Environment assets
│   │   └── UI/                 # Interface graphics
│   ├── Audio/
│   │   ├── Music/              # Background music
│   │   ├── SFX/                # Sound effects
│   │   └── Voice/              # Character voice lines
│   ├── Prefabs/                # Reusable game objects
│   ├── Scenes/                 # Unity scenes
│   └── Resources/              # Loadable assets
├── GAME_DESIGN_DOCUMENT.md     # Comprehensive game design
├── TECHNICAL_ARCHITECTURE.md   # Technical specifications
└── README.md                   # This file
```

---

## 🎯 Core Gameplay Systems

### Pitching System
- **Touch Controls:** Swipe to select location, tap to throw
- **Pitch Types:** Fastball, Curveball, Changeup, Knuckleball
- **Mechanics:** Timing-based accuracy with physics simulation
- **Location:** `/Assets/Scripts/Gameplay/Baseball/PitchingSystem.cs`

### Batting System
- **Touch Controls:** Tap and hold to prepare, release to swing
- **Contact System:** Perfect/Good/Okay/Miss timing windows
- **Hit Physics:** Launch angle, power, and direction based on contact
- **Location:** `/Assets/Scripts/Gameplay/Baseball/BattingSystem.cs`

### Fielding System
- **AI-Assisted:** Smart auto-fielding with manual override
- **Touch Controls:** Tap fielder, swipe to throw
- **Mechanics:** Catch detection, throwing accuracy
- **Location:** `/Assets/Scripts/Gameplay/Baseball/FieldingSystem.cs` (to be created)

### Base Running
- **Touch Controls:** Tap runner to advance/retreat
- **Stealing:** Swipe-based timing mini-game
- **Auto-Running:** Smart AI for obvious plays
- **Location:** `/Assets/Scripts/Gameplay/Baseball/BaseRunning.cs` (to be created)

---

## 👥 Character System

### Character Archetypes
1. **Power Hitters** - High power, lower contact
2. **Contact Specialists** - High contact, lower power
3. **Speedsters** - High speed, balanced stats
4. **Aces** - Elite pitchers
5. **Balanced** - Well-rounded players
6. **Comic Relief** - Funny characters with quirky stats

### Special Abilities
Each character has a unique special ability:
- Power Boost
- Speed Burst
- Perfect Contact
- Guaranteed Strike
- Team Rally

### Progression
- Level up through gameplay
- Earn XP from games
- Unlock stat boosts and new abilities
- Prestige system for cosmetic rewards

**Data Structure:** `/Assets/Scripts/Characters/PlayerData.cs`

---

## 🏟️ Stadium System

### 12 Unique Stadiums
1. **Sunny Meadows Park** - Classic suburban backyard
2. **Beach Blast Boardwalk** - Sandy beach setting
3. **Desert Dust Bowl** - Southwest desert
4. **Snowy Summit Field** - Winter mountain
5. **Urban Rooftop Arena** - City rooftop
6. **Enchanted Forest Field** - Magical woods
7. **Carnival Chaos Diamond** - Amusement park
8. **Farm Fresh Field** - Rural farmland
9. **Space Station Zero-G** - Futuristic space
10. **Prehistoric Park** - Dinosaur era
11. **Neon Nights Stadium** - Retro 80s
12. **Championship Castle** - Medieval castle

Each stadium has:
- Unique dimensions affecting gameplay
- Environmental features and hazards
- Day/night variations
- Weather effects

---

## 📱 Mobile Optimization

### Touch Controls
- **Large tap targets** (60x60px minimum)
- **Visual feedback** on all interactions
- **Haptic feedback** for immersive feel
- **One-handed play** support
- **Gesture-based** for natural interactions

### Performance Targets
- **60 FPS** on modern devices
- **30 FPS minimum** on older devices
- **< 500MB** download size
- **< 5 seconds** loading time
- **< 10%** battery usage per 30 minutes

### Optimization Techniques
- Object pooling for balls/effects
- LOD system for 3D models
- Texture atlasing for UI
- Asset bundle streaming
- Memory management system

---

## 🎨 Art Direction

### Visual Style
- Bright, saturated colors
- Large-headed characters (2:1 head-to-body ratio)
- Exaggerated animations with squash & stretch
- Chunky UI with comic book fonts

### Technical Specifications
- **Characters:** 1,500-3,000 tris, 512x512 textures
- **Stadiums:** 15,000 tris total, 1024x1024 textures
- **Shaders:** Mobile-optimized, PBR workflow
- **Lighting:** Baked lightmaps with real-time shadows

---

## 🎵 Audio System

### Music Tracks
- Main Menu Theme
- Team Selection Music
- Gameplay Themes (3 variations)
- Victory/Defeat Themes
- Mode-specific music

### Sound Effects
- Bat contact sounds (various qualities)
- Pitch whoosh sounds
- Crowd reactions
- UI sounds
- Ambient stadium sounds

### Voice Acting
- Character catchphrases
- Batting/fielding callouts
- Celebrations and reactions
- Optional announcer commentary

**System:** `/Assets/Scripts/Core/AudioManager.cs` (to be created)

---

## 🎯 Game Modes

### Quick Play
- Pick teams and play immediately
- 3, 5, or 9 inning options
- Perfect for short sessions

### Season Mode
- 20-game season + playoffs
- Team management between games
- Player stats tracked
- Championship trophy reward

### Tournament Mode
- Single-elimination brackets
- 8 or 16 team tournaments
- Unlockable rewards

### Home Run Derby
- Arcade batting mini-game
- Combo system and multipliers
- Global leaderboards

### Practice Mode
- Batting practice
- Pitching practice
- Fielding drills

---

## 🏆 Progression & Unlocks

### Unlock System
- **Start with:** 12 characters, 4 stadiums
- **Unlock through:** Gameplay achievements, leveling, wins
- **Total unlockables:** 30 characters, 12 stadiums

### Achievement System
- 100+ achievements
- Gameplay, collection, skill, and secret achievements
- Rewards: XP, characters, stadiums, cosmetics

### Daily Challenges
- New challenge each day
- Weekly tournaments
- Seasonal events with exclusive rewards

### Leaderboards
- Global and friend rankings
- Season win rate
- Home run leader
- Batting average
- Strikeout king

---

## 🔧 Development Setup

### Prerequisites
1. Unity 2022.3 LTS or later
2. iOS or Android build support
3. Git LFS for large assets
4. Text editor (VS Code, Rider)

### Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/ahump20/blaze-worlds-github.git
cd blaze-worlds-github/mobile-baseball-game
```

2. **Open in Unity:**
- Launch Unity Hub
- Add project from disk
- Select the `mobile-baseball-game` folder

3. **Install dependencies:**
- Open Package Manager
- Install required packages (listed in Packages/manifest.json)

4. **Run the game:**
- Open MainMenu scene
- Press Play in Unity Editor

### Building for Mobile

**iOS:**
```bash
# In Unity Editor:
# File > Build Settings > iOS
# Configure signing & provisioning
# Build and run on device
```

**Android:**
```bash
# In Unity Editor:
# File > Build Settings > Android
# Configure keystore
# Build APK or AAB
```

---

## 📖 Documentation

Comprehensive documentation available:

1. **[Game Design Document](GAME_DESIGN_DOCUMENT.md)** - Full game design, mechanics, characters, stadiums
2. **[Technical Architecture](TECHNICAL_ARCHITECTURE.md)** - System design, code structure, implementation details
3. **Code Comments** - Inline documentation in all scripts

---

## 🎓 Learning Resources

### Backyard Baseball 2001 Inspiration
This game captures the **spirit and gameplay feel** of Backyard Baseball 2001 while being **100% original**:

✅ **What we captured:**
- Simple, intuitive controls
- Character personality and humor
- Strategic team composition
- Kid-friendly atmosphere
- Replayable season mode

✅ **What we improved:**
- Mobile-first design
- Cross-platform support
- Online features
- Modern progression systems
- Better accessibility

❌ **What we avoided:**
- No MLB player names/likenesses
- No copyrighted team names
- No Humongous Entertainment IP
- Distinct art style
- 100% original audio
- All code written from scratch

---

## ⚖️ Legal & IP Compliance

### Copyright Clearance
- ✅ All character names are original
- ✅ All art assets are original or licensed
- ✅ All music is original or licensed
- ✅ All code is written from scratch
- ✅ No trademarked names used
- ✅ No player likenesses

### Trademark Avoidance
- Game title is original: "Backyard Blaze Baseball"
- No MLB or team trademarks
- No reference to Humongous Entertainment
- All IP created specifically for this game

---

## 🚀 Roadmap

### Phase 1: Core Development ✅ (Current)
- [x] Game design documentation
- [x] Technical architecture
- [x] Core gameplay systems
- [x] Character system
- [x] Touch controls
- [ ] Complete all baseball mechanics
- [ ] UI/UX implementation

### Phase 2: Content Creation
- [ ] Character models (30)
- [ ] Stadium environments (12)
- [ ] Animation implementation
- [ ] Audio asset creation
- [ ] UI polish

### Phase 3: Game Modes
- [ ] Quick Play
- [ ] Season Mode
- [ ] Tournament Mode
- [ ] Home Run Derby
- [ ] Practice Mode

### Phase 4: Polish & Optimization
- [ ] Performance optimization
- [ ] Mobile device testing
- [ ] Balance adjustments
- [ ] Bug fixes

### Phase 5: Launch
- [ ] App Store submission
- [ ] Marketing materials
- [ ] Soft launch
- [ ] Global launch

---

## 🤝 Contributing

This is a proprietary project for Blaze Intelligence. For questions or collaboration inquiries, contact:

**Austin Humphrey**
- Email: ahump20@outlook.com
- GitHub: https://github.com/ahump20

---

## 📄 License

Copyright © 2024 Blaze Intelligence. All rights reserved.

This is proprietary software. Unauthorized copying, modification, or distribution is prohibited.

---

## 🎉 Credits

**Development:** Austin Humphrey & Blaze Intelligence Team

**Inspiration:** Classic backyard baseball games (gameplay feel only, no IP used)

**Built with:** Unity, C#, Passion for baseball

---

*Play ball! Let's build something amazing!* ⚾🔥
