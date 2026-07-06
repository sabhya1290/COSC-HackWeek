/**
 * Rock Paper Scissors — Game Logic
 * Player vs Computer, score tracking, round history
 */

// ─── Game Data ───────────────────────────────────────────────────────────────

/** Maps each choice to its emoji for display */
const EMOJIS = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️'
};

/** Defines which choice beats which.
 *  Key beats Value: e.g. rock beats scissors */
const BEATS = {
    rock: 'scissors',
    scissors: 'paper',
    paper: 'rock'
};

/** All valid choices as an array — used for random computer pick */
const CHOICES = Object.keys(BEATS); // ['rock', 'scissors', 'paper']

/** Tracks live game state */
let state = {
    playerScore: 0,
    computerScore: 0,
    drawCount: 0,
    totalRounds: 0,
    history: []      // Stores the last 5 rounds
};

// ─── DOM References ──────────────────────────────────────────────────────────

const scorePlayer = document.getElementById('score-player');
const scoreComputer = document.getElementById('score-computer');
const scoreDraw = document.getElementById('score-draw');
const roundCount = document.getElementById('round-count');

const playerEmoji = document.getElementById('player-emoji');
const computerEmoji = document.getElementById('computer-emoji');
const playerChoiceName = document.getElementById('player-choice-name');
const computerChoiceName = document.getElementById('computer-choice-name');
const resultMessage = document.getElementById('result-message');

const historyList = document.getElementById('history-list');
const btnReset = document.getElementById('btn-reset');
const choiceBtns = document.querySelectorAll('.choice-btn');

// ─── Core Game Functions ─────────────────────────────────────────────────────

/**
 * Generates a random computer choice from the CHOICES array.
 * Math.random() returns a float in [0, 1).
 * Multiplying by CHOICES.length and flooring gives an integer index.
 * @returns {string} 'rock', 'paper', or 'scissors'
 */
function getComputerChoice() {
    const index = Math.floor(Math.random() * CHOICES.length);
    return CHOICES[index];
}

/**
 * Determines the result of a round given the player's and computer's choices.
 * Uses the BEATS map: if player's choice beats computer's choice, player wins.
 * If both chose the same thing, it's a draw.
 * @param {string} player - player's choice
 * @param {string} computer - computer's choice
 * @returns {'win'|'lose'|'draw'}
 */
function getResult(player, computer) {
    if (player === computer) return 'draw';
    if (BEATS[player] === computer) return 'win';
    return 'lose';
}

/**
 * Updates the score counters in state and reflects them in the DOM.
 * @param {'win'|'lose'|'draw'} result
 */
function updateScores(result) {
    if (result === 'win') state.playerScore++;
    if (result === 'lose') state.computerScore++;
    if (result === 'draw') state.drawCount++;

    // Reflect updated totals in the scoreboard
    scorePlayer.textContent = state.playerScore;
    scoreComputer.textContent = state.computerScore;
    scoreDraw.textContent = state.drawCount;
}

/**
 * Updates the result panel in the DOM to show both choices and the outcome message.
 * Triggers the .pop animation on both emoji elements for subtle feedback.
 * @param {string} playerChoice
 * @param {string} computerChoice
 * @param {'win'|'lose'|'draw'} result
 */
function updateResultDisplay(playerChoice, computerChoice, result) {
    // Trigger pop animation: remove class first so it can re-trigger
    [playerEmoji, computerEmoji].forEach(el => {
        el.classList.remove('pop');
        // Void offsetWidth forces a reflow, re-enabling the animation
        void el.offsetWidth;
        el.classList.add('pop');
    });

    playerEmoji.textContent = EMOJIS[playerChoice];
    computerEmoji.textContent = EMOJIS[computerChoice];
    playerChoiceName.textContent = capitalise(playerChoice);
    computerChoiceName.textContent = capitalise(computerChoice);

    // Set the message text and color class based on outcome
    const messages = {
        win: 'You win this round! 🎉',
        lose: 'Computer wins this round.',
        draw: "It's a draw!"
    };

    resultMessage.textContent = messages[result];
    // Remove old state classes, add new one for color styling
    resultMessage.classList.remove('win', 'lose', 'draw', 'idle');
    resultMessage.classList.add(result);

    state.totalRounds++;
    roundCount.textContent = `Round ${state.totalRounds}`;
}

/**
 * Adds a round entry to the history array (capped at 5) and re-renders the list.
 * @param {string} playerChoice
 * @param {string} computerChoice
 * @param {'win'|'lose'|'draw'} result
 */
function addToHistory(playerChoice, computerChoice, result) {
    const outcomeText = { win: 'You won', lose: 'Computer won', draw: 'Draw' };

    // Prepend the newest round to the front of the array
    state.history.unshift({
        playerChoice,
        computerChoice,
        result,
        outcomeText: outcomeText[result]
    });

    // Keep only the most recent 5 rounds
    if (state.history.length > 5) {
        state.history.pop();
    }

    renderHistory();
}

/**
 * Renders the round history list from state.history into the DOM.
 * Uses createElement/textContent for safe DOM insertion.
 */
function renderHistory() {
    historyList.textContent = ''; // Safe clear

    if (state.history.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'history-empty';
        empty.textContent = 'No rounds played yet.';
        historyList.appendChild(empty);
        return;
    }

    state.history.forEach((entry, i) => {
        const li = document.createElement('li');
        li.className = 'history-item';

        // Left side: round detail text
        const detail = document.createElement('span');
        detail.textContent = `Round ${state.totalRounds - i}: You chose ${capitalise(entry.playerChoice)}, Computer chose ${capitalise(entry.computerChoice)}`;

        // Right side: outcome badge
        const badge = document.createElement('span');
        badge.className = `history-outcome ${entry.result}`;
        badge.textContent = entry.outcomeText;

        li.appendChild(detail);
        li.appendChild(badge);
        historyList.appendChild(li);
    });
}

// ─── Main Play Function ───────────────────────────────────────────────────────

/**
 * Called when the player clicks a choice button.
 * Orchestrates the full round: computer choice → result → display → scores → history.
 * @param {string} playerChoice - the choice from the clicked button's data-choice attribute
 */
function play(playerChoice) {
    // Remove 'selected' highlight from all buttons, then highlight the clicked one
    choiceBtns.forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`btn-${playerChoice}`).classList.add('selected');

    // Get random computer choice
    const computerChoice = getComputerChoice();

    // Determine winner
    const result = getResult(playerChoice, computerChoice);

    // Update result panel display
    updateResultDisplay(playerChoice, computerChoice, result);

    // Update score totals
    updateScores(result);

    // Add round to history panel
    addToHistory(playerChoice, computerChoice, result);
}

// ─── Reset Function ───────────────────────────────────────────────────────────

/**
 * Resets all game state back to zero and clears the display.
 * Called when the player clicks the Reset Game button.
 */
function resetGame() {
    // Reset state object
    state.playerScore = 0;
    state.computerScore = 0;
    state.drawCount = 0;
    state.totalRounds = 0;
    state.history = [];

    // Reset scoreboard
    scorePlayer.textContent = '0';
    scoreComputer.textContent = '0';
    scoreDraw.textContent = '0';
    roundCount.textContent = 'Round 0';

    // Reset result panel
    playerEmoji.textContent = '—';
    computerEmoji.textContent = '—';
    playerChoiceName.textContent = '—';
    computerChoiceName.textContent = '—';
    resultMessage.textContent = 'Make a move to start playing.';
    resultMessage.classList.remove('win', 'lose', 'draw');
    resultMessage.classList.add('idle');

    // Remove selected highlight from all choice buttons
    choiceBtns.forEach(btn => btn.classList.remove('selected'));

    // Re-render empty history
    renderHistory();
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Capitalises the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalise(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Event Listeners ─────────────────────────────────────────────────────────

// Attach a click handler to each of the three choice buttons
choiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        play(btn.dataset.choice);
    });
});

// Reset button
btnReset.addEventListener('click', resetGame);

// ─── Initialise ──────────────────────────────────────────────────────────────

// Set the initial idle state for the result message and render the empty history
resultMessage.classList.add('idle');
renderHistory();
