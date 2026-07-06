# Rock Paper Scissors Game

A responsive browser-based **Rock Paper Scissors** game where you play against a randomly selecting computer opponent. The project is built with plain HTML, CSS, and JavaScript—no frameworks or installation required.

## Features

- Play Rock, Paper, or Scissors against the computer
- Random computer choice each round
- Live scoreboard for player wins, computer wins, and draws
- Clear round-result panel showing both selections
- Tracks the current round number
- Displays the latest 5 rounds with outcome labels
- Reset button to clear scores, history, selected choice, and result display
- Responsive layout:
  - Compact single-column experience on small screens
  - Two-column layout with a sticky scoreboard on screens wider than 600px
- Keyboard-friendly buttons with visible focus states
- Accessible labels and live result announcements

## Game Rules

- Rock beats Scissors
- Scissors beats Paper
- Paper beats Rock
- Choosing the same option results in a draw

## Project Structure

```text
.
├── index.html   # Page structure and game controls
├── style.css    # Responsive layout, colors, states, and animations
├── app.js       # Game logic, score tracking, history, and event handlers
└── README.md    # Project documentation
```

## How to Run

1. Download or clone the project files.
2. Keep `index.html`, `style.css`, and `app.js` in the same folder.
3. Open `index.html` in any modern web browser.

No dependencies, build tools, or server setup are needed.

## How It Works

### HTML (`index.html`)
Creates the interface: title, scoreboard, three choice buttons, round result area, recent-history list, and reset button. It links the stylesheet and JavaScript file.

### CSS (`style.css`)
Defines a warm, minimal interface using CSS variables for reusable colors and spacing. It includes hover, active, selected, and focus states, an emoji pop animation, and media queries for wide and narrow screens.

### JavaScript (`app.js`)
Handles the full game flow:

1. Reads the player's selected choice.
2. Generates a random computer choice.
3. Compares both choices to determine a win, loss, or draw.
4. Updates the result display and scoreboard.
5. Stores and renders up to five recent rounds.
6. Resets the game when **Reset Game** is clicked.

## Main JavaScript Functions

| Function | Purpose |
|---|---|
| `getComputerChoice()` | Selects Rock, Paper, or Scissors randomly for the computer. |
| `getResult(player, computer)` | Determines whether the player wins, loses, or draws. |
| `updateScores(result)` | Updates score values in the game state and UI. |
| `updateResultDisplay(...)` | Shows both choices, the round message, and round number. |
| `addToHistory(...)` | Adds a new round while keeping only the latest five. |
| `renderHistory()` | Renders the round-history list safely in the DOM. |
| `play(playerChoice)` | Runs one complete game round. |
| `resetGame()` | Returns the game to its initial state. |

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript