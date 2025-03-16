# GlimmerHold

A fast-paced survival game where you control a light entity trying to survive in a world of encroaching darkness.

![GlimmerHold Game](https://i.imgur.com/placeholder.png) <!-- Replace with an actual screenshot of your game -->

## Description

GlimmerHold is a browser-based arcade game built with p5.js. You play as a light entity surrounded by various types of shadow enemies. Your goal is to survive as long as possible, collect power-ups, and achieve the highest score.

## Features

- **Multiple Enemy Types**: Face different enemies with unique behaviors:
  - **Hunters**: Fast enemies that chase you directly
  - **Dashers**: Enemies that move in quick bursts
  - **Splitters**: Enemies that split into smaller versions when destroyed
  - **Bombers**: Enemies that explode when near you

- **Character Selection**: Choose from three different character types:
  - **Soldier**: Balanced speed and energy
  - **Tank**: Slower but with more energy
  - **Fighter Jet**: Faster but with less energy

- **Power-ups**: Collect special abilities to help you survive:
  - **Shield**: Temporary invulnerability
  - **Speed**: Movement speed boost
  - **Energy**: Restore your energy
  - **Blast**: Clear all enemies from the screen

- **Difficulty Levels**: Test your skills with four difficulty settings:
  - Easy
  - Normal
  - Hard
  - Insane

- **High Score Tracking**: Separate high scores for each difficulty level

## How to Play

1. **Start the Game**: Select your character and difficulty level on the title screen
2. **Movement**: Use arrow keys to move your light entity
3. **Blast Ability**: Press SPACE to dash forward and destroy nearby enemies
4. **Collect Power-ups**: Grab the glowing items for special abilities
5. **Survive**: Avoid enemies and manage your energy to survive as long as possible

## Controls

- **Arrow Keys**: Move your character
- **Space**: Use blast ability (costs energy)
- **R**: Restart game (on game over screen)
- **T**: Return to title screen (on game over screen)
- **Enter**: Start game (on title screen)
- **Shift**: Cycle through difficulty levels (on title screen)

## Scoring

- Survive longer to earn more points
- Destroy enemies with your blast ability for bonus points:
  - Hunters: 60 points
  - Dashers: 75 points
  - Splitters: 75 points
  - Bombers: 90 points
- Collect sparks for 50 points each
- Collect power-ups for 100 points each

## Setup and Running

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/GlimmerHold.git
cd GlimmerHold
```

2. Start a local server:
   - Using Python:
     ```bash
     # Python 3
     python -m http.server
     
     # Python 2
     python -m SimpleHTTPServer
     ```
   - Using Node.js:
     ```bash
     # Install http-server if you haven't already
     npm install -g http-server
     
     # Start the server
     http-server
     ```

3. Open your browser and navigate to:
```
http://localhost:8000/
```

## Technologies Used

- HTML5
- JavaScript
- [p5.js](https://p5js.org/) - JavaScript library for creative coding

## Future Enhancements

- Mobile touch controls
- Additional enemy types
- More power-ups and abilities
- Multiplayer mode

## Credits

Created by [MicahPClark]

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
