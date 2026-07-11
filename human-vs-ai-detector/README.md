# Human vs AI Detector Game 🕵️‍♂️🤖

An engaging, premium, and responsive full-stack game where players investigate and determine whether content (images, text, code, artwork, or voice clips) was created by a Human or an AI. 

## Features
- **Gameplay**: 10-round interactive game modes with a glassmorphism theme and custom Framer Motion animations.
- **Dynamic Clues & Explanations**: Details of why each item was created by AI or Human, including visual/textual anomalies.
- **Sound Synth (Web Audio API)**: Retro gaming sounds generated dynamically by the browser, removing any dependencies on static assets.
- **Voice Narration (SpeechSynthesis)**: Audio narration of text-based questions, adjusting tone dynamically.
- **Game Modes**:
  - **Single Player Campaign**: 10 random questions matching category and difficulty.
  - **Daily Challenge**: 5 deterministic questions reset daily.
  - **Local VS (Multiplayer)**: Pass-and-play duel modes with scoreboard comparison.
- **Statistics Dashboard**: High-quality visual metrics of total played games, favorite category, and average accuracy.
- **Hall of Fame (Leaderboard)**: Top score tracking with name, score, accuracy, difficulty, and date.
- **Admin Panel**: Screen to directly insert and persist custom questions into the database.
- **Keyboard Shortcuts**:
  - `1` or `H` key: Choose Human
  - `2` or `A` key: Choose AI
  - `Enter` or `S` key: Lock/Submit Guess
  - `Space` or `Enter` key: Continue to next question
  - `I` key: Trigger hint

---

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Axios, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express.js.
- **Database**: Local JSON dataset with file-based persistence for leaderboard, questions, and statistics.

---

## Folder Structure
```
human-vs-ai-detector/
├── package.json         # Monorepo root runner
├── server/
│   ├── index.js         # Express main application
│   ├── data/
│   │   ├── questions.json # Preseeded and custom questions database
│   │   ├── leaderboard.json
│   │   └── stats.json
│   ├── controllers/
│   │   ├── questionController.js
│   │   └── leaderboardController.js
│   └── routes/
│       ├── questions.js
│       └── leaderboard.js
└── client/
    ├── index.html
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── hooks/
        │   └── useLocalStorage.js
        ├── utils/
        │   └── api.js
        └── components/
            ├── AudioSynth.js  # Web Audio API Synthesizer
            ├── Leaderboard.jsx
            ├── Statistics.jsx
            ├── AdminPanel.jsx
            ├── MultiplayerMode.jsx
            └── DailyChallenge.jsx
```

---

## API Endpoints

### Questions
- **GET** `/api/question` - Fetches a random question. Optional query parameters: `type` (category), `difficulty`, `exclude` (comma-separated list of IDs to avoid duplicates).
- **POST** `/api/answer` - Submit a guess. Request body: `{ "questionId": 1, "guess": "Human" }`. Returns: `{ "correct": true/false, "answer": "Human/AI", "explanation": "..." }`.
- **POST** `/api/question/admin` - Add a custom question.

### Leaderboard & Analytics
- **GET** `/api/leaderboard` - Top scores list.
- **POST** `/api/leaderboard` - Post a new player score.
- **GET** `/api/stats` - Overall analytics metrics.
- **POST** `/api/stats/gameover` - Increments games played.

---

## Getting Started

### Prerequisites
- Node.js installed on your machine.

### Installation
From the root directory (`human-vs-ai-detector`), run:
```bash
npm run install-all
```
This automatically runs `npm install` inside the root, the `server`, and the `client` directories.

### Running the Application Locally
To launch both the server (on port 5000) and the client dev server (on port 5173) concurrently, run:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to play!
