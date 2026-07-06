/**
 * CGPA/GPA Calculator Logic - 10-Point Indian Grading System
 * Safe DOM rendering implementation (preventing innerHTML injection of user inputs).
 */

// Grading System Definitions
const GRADING_SYSTEMS = {
    'standard': [
        { label: 'O', points: 10 },
        { label: 'A+', points: 9 },
        { label: 'A', points: 8 },
        { label: 'B+', points: 7 },
        { label: 'B', points: 6 },
        { label: 'C', points: 5 },
        { label: 'P', points: 4 },
        { label: 'F', points: 0 },
        { label: 'Absent', points: 0 }
    ],
    'double-letter': [
        { label: 'AA', points: 10 },
        { label: 'AB', points: 9 },
        { label: 'BB', points: 8 },
        { label: 'BC', points: 7 },
        { label: 'CC', points: 6 },
        { label: 'CD', points: 5 },
        { label: 'DD', points: 4 },
        { label: 'FP', points: 0 },
        { label: 'FA', points: 0 }
    ]
};

// Default State (Saved to localStorage)
let state = {
    gradingSystem: 'standard',
    currentSemesterName: 'Semester 1',
    currentSubjects: [
        { id: 'sub-1', name: 'Subject 1', credits: 4, gradeLabel: 'O', gradeValue: 10 },
        { id: 'sub-2', name: 'Subject 2', credits: 3, gradeLabel: 'A+', gradeValue: 9 },
        { id: 'sub-3', name: 'Subject 3', credits: 3, gradeLabel: 'A', gradeValue: 8 }
    ],
    completedSemesters: [],
    futureSemesters: [
        { id: 'fut-1', name: 'Future Semester 1', gpa: 8.0, credits: 20 }
    ]
};

// Save state helper
function saveState() {
    localStorage.setItem('cgpa_planner_state_v3', JSON.stringify(state));
}

// Load state helper
function loadState() {
    const saved = localStorage.getItem('cgpa_planner_state_v3');
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading state from localStorage:', e);
        }
    }
}

// Get active grades list
function getActiveGrades() {
    return GRADING_SYSTEMS[state.gradingSystem] || GRADING_SYSTEMS['standard'];
}

// Start application
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initApp();
});

function initApp() {
    const selector = document.getElementById('grading-system-select');
    selector.value = state.gradingSystem;

    document.getElementById('current-semester-name').value = state.currentSemesterName;

    renderMappingDisplay();
    renderCurrentSemester();
    renderHistory();
    calculateResults();
    renderFutureSemesters();
    runSimulatorCalculations();
    setupEventListeners();
}

// Render active grade-to-point mapping below selector
function renderMappingDisplay() {
    const display = document.getElementById('mapping-display');
    const grades = getActiveGrades();
    
    display.textContent = '';
    grades.forEach(g => {
        const span = document.createElement('span');
        span.className = 'mapping-item';
        span.textContent = `${g.label} = ${g.points}`;
        display.appendChild(span);
    });
}

// Render dynamic input rows for the current active semester using safe DOM methods
function renderCurrentSemester() {
    const container = document.getElementById('current-subjects-list');
    container.textContent = ''; // Safe clear

    state.currentSubjects.forEach((sub, subIdx) => {
        const row = document.createElement('div');
        row.className = 'subject-row';

        const nameError = sub.name !== undefined && sub.name.trim() === "";
        const creditsError = sub.credits !== undefined && (isNaN(parseFloat(sub.credits)) || parseFloat(sub.credits) <= 0);

        // 1. Subject Name input wrapper - using document.createElement & input.value is immune to HTML injection
        const nameWrapper = document.createElement('div');
        nameWrapper.className = 'input-wrapper';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Subject Name';
        nameInput.value = sub.name || ''; // Safe assignment of user inputs
        nameInput.className = 'sub-name-input';
        if (nameError) nameInput.classList.add('input-error');
        nameInput.dataset.subIdx = subIdx;
        nameInput.setAttribute('aria-label', 'Subject Name');
        nameInput.required = true;

        const nameErrorSpan = document.createElement('span');
        nameErrorSpan.className = `error-text ${nameError ? '' : 'hidden'}`;
        nameErrorSpan.setAttribute('role', 'alert');
        nameErrorSpan.textContent = nameError ? 'Subject name required' : '';

        nameWrapper.appendChild(nameInput);
        nameWrapper.appendChild(nameErrorSpan);

        // 2. Credits input wrapper - using input.value
        const creditsWrapper = document.createElement('div');
        creditsWrapper.className = 'input-wrapper';
        
        const creditsInput = document.createElement('input');
        creditsInput.type = 'number';
        creditsInput.placeholder = 'Credits';
        creditsInput.value = sub.credits !== undefined ? sub.credits : ''; // Safe assignment
        creditsInput.min = '0.1';
        creditsInput.step = '0.1';
        creditsInput.className = 'sub-credits-input';
        if (creditsError) creditsInput.classList.add('input-error');
        creditsInput.dataset.subIdx = subIdx;
        creditsInput.setAttribute('aria-label', 'Credits');
        creditsInput.required = true;

        const creditsErrorSpan = document.createElement('span');
        creditsErrorSpan.className = `error-text ${creditsError ? '' : 'hidden'}`;
        creditsErrorSpan.setAttribute('role', 'alert');
        creditsErrorSpan.textContent = creditsError ? 'Credits must be > 0' : '';

        creditsWrapper.appendChild(creditsInput);
        creditsWrapper.appendChild(creditsErrorSpan);

        // 3. Grade select element creation
        const gradeWrapper = document.createElement('div');
        gradeWrapper.className = 'input-wrapper';

        const gradeSelect = document.createElement('select');
        gradeSelect.className = 'sub-grade-select';
        gradeSelect.dataset.subIdx = subIdx;
        gradeSelect.setAttribute('aria-label', 'Select Grade');

        const grades = getActiveGrades();
        grades.forEach(g => {
            const option = document.createElement('option');
            option.value = g.points;
            option.textContent = `${g.label} (${g.points})`;
            option.dataset.label = g.label;
            if (sub.gradeLabel === g.label) {
                option.selected = true;
            }
            gradeSelect.appendChild(option);
        });
        gradeWrapper.appendChild(gradeSelect);

        // 4. Remove button creation
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-remove delete-sub-btn';
        deleteBtn.dataset.subIdx = subIdx;
        deleteBtn.setAttribute('aria-label', 'Remove subject row');
        deleteBtn.textContent = 'Remove';

        // Assemble row safely
        row.appendChild(nameWrapper);
        row.appendChild(creditsWrapper);
        row.appendChild(gradeWrapper);
        row.appendChild(deleteBtn);

        container.appendChild(row);
    });
}

// Render completed semesters list using safe DOM creation APIs
function renderHistory() {
    const container = document.getElementById('history-list');
    container.textContent = ''; // Safe clear

    if (state.completedSemesters.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.setAttribute('role', 'status');
        emptyDiv.textContent = 'No completed semesters saved yet. Add a semester to see history.';
        container.appendChild(emptyDiv);
        return;
    }

    state.completedSemesters.forEach((sem, idx) => {
        const item = document.createElement('div');
        item.className = 'history-item';

        const info = document.createElement('div');
        info.className = 'history-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'history-name';
        nameSpan.textContent = sem.name; // Safe assignment prevents XSS on semester names

        const stats = document.createElement('div');
        stats.className = 'history-stats';

        const gpaLabel = document.createElement('strong');
        gpaLabel.textContent = 'GPA: ';
        const gpaVal = document.createTextNode(`${sem.gpa.toFixed(2)}   `);

        const creditsLabel = document.createElement('strong');
        creditsLabel.textContent = 'Credits: ';
        const creditsVal = document.createTextNode(sem.credits.toFixed(1));

        stats.appendChild(gpaLabel);
        stats.appendChild(gpaVal);
        stats.appendChild(creditsLabel);
        stats.appendChild(creditsVal);

        info.appendChild(nameSpan);
        info.appendChild(stats);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-remove delete-history-btn';
        deleteBtn.dataset.idx = idx;
        deleteBtn.setAttribute('aria-label', `Delete ${sem.name} from history`);
        deleteBtn.textContent = 'Remove';

        item.appendChild(info);
        item.appendChild(deleteBtn);
        container.appendChild(item);
    });
}

// Render future semesters simulator rows safely using DOM methods
function renderFutureSemesters() {
    const container = document.getElementById('future-semesters-list');
    container.textContent = ''; // Safe clear

    state.futureSemesters.forEach((sem, idx) => {
        const row = document.createElement('div');
        row.className = 'future-sem-row';

        const nameError = !sem.name || sem.name.trim() === "";
        const gpaError = isNaN(parseFloat(sem.gpa)) || parseFloat(sem.gpa) < 0 || parseFloat(sem.gpa) > 10;
        const creditsError = isNaN(parseFloat(sem.credits)) || parseFloat(sem.credits) <= 0;

        // 1. Name Input Wrapper
        const nameWrapper = document.createElement('div');
        nameWrapper.className = 'input-wrapper';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = sem.name || ''; // Safe assignment of user inputs
        nameInput.placeholder = 'Name';
        nameInput.className = 'fut-sem-name-input';
        if (nameError) nameInput.classList.add('input-error');
        nameInput.dataset.idx = idx;
        nameInput.setAttribute('aria-label', 'Future Semester Name');
        nameInput.required = true;

        const nameErrorSpan = document.createElement('span');
        nameErrorSpan.className = `error-text ${nameError ? '' : 'hidden'}`;
        nameErrorSpan.setAttribute('role', 'alert');
        nameErrorSpan.textContent = nameError ? 'Required' : '';

        nameWrapper.appendChild(nameInput);
        nameWrapper.appendChild(nameErrorSpan);

        // 2. GPA Input Wrapper
        const gpaWrapper = document.createElement('div');
        gpaWrapper.className = 'input-wrapper';

        const gpaInput = document.createElement('input');
        gpaInput.type = 'number';
        gpaInput.value = sem.gpa !== undefined ? sem.gpa : ''; // Safe assignment
        gpaInput.placeholder = 'Expected GPA';
        gpaInput.min = '0';
        gpaInput.max = '10';
        gpaInput.step = '0.1';
        gpaInput.className = 'fut-sem-gpa-input';
        if (gpaError) gpaInput.classList.add('input-error');
        gpaInput.dataset.idx = idx;
        gpaInput.setAttribute('aria-label', 'Expected GPA');
        gpaInput.required = true;

        const gpaErrorSpan = document.createElement('span');
        gpaErrorSpan.className = `error-text ${gpaError ? '' : 'hidden'}`;
        gpaErrorSpan.setAttribute('role', 'alert');
        gpaErrorSpan.textContent = gpaError ? '0 to 10' : '';

        gpaWrapper.appendChild(gpaInput);
        gpaWrapper.appendChild(gpaErrorSpan);

        // 3. Credits Input Wrapper
        const creditsWrapper = document.createElement('div');
        creditsWrapper.className = 'input-wrapper';

        const creditsInput = document.createElement('input');
        creditsInput.type = 'number';
        creditsInput.value = sem.credits !== undefined ? sem.credits : ''; // Safe assignment
        creditsInput.placeholder = 'Credits';
        creditsInput.min = '0.1';
        creditsInput.step = '0.1';
        creditsInput.className = 'fut-sem-credits-input';
        if (creditsError) creditsInput.classList.add('input-error');
        creditsInput.dataset.idx = idx;
        creditsInput.setAttribute('aria-label', 'Expected Credits');
        creditsInput.required = true;

        const creditsErrorSpan = document.createElement('span');
        creditsErrorSpan.className = `error-text ${creditsError ? '' : 'hidden'}`;
        creditsErrorSpan.setAttribute('role', 'alert');
        creditsErrorSpan.textContent = creditsError ? 'Must be > 0' : '';

        creditsWrapper.appendChild(creditsInput);
        creditsWrapper.appendChild(creditsErrorSpan);

        // 4. Remove button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-remove delete-fut-sem-btn';
        deleteBtn.dataset.idx = idx;
        deleteBtn.setAttribute('aria-label', 'Remove future semester row');
        deleteBtn.textContent = 'Remove';

        // Assemble Row safely
        row.appendChild(nameWrapper);
        row.appendChild(gpaWrapper);
        row.appendChild(creditsWrapper);
        row.appendChild(deleteBtn);

        container.appendChild(row);
    });
}

// Calculate cumulative CGPA and credits
function calculateResults() {
    let totalCredits = 0;
    let weightedGPASum = 0;

    state.completedSemesters.forEach(sem => {
        weightedGPASum += sem.gpa * sem.credits;
        totalCredits += sem.credits;
    });

    const cgpa = totalCredits > 0 ? (weightedGPASum / totalCredits) : 0;

    // Update displays
    document.getElementById('cgpa-value').textContent = cgpa.toFixed(2);
    document.getElementById('total-credits').textContent = totalCredits.toFixed(1);
    document.getElementById('total-semesters').textContent = state.completedSemesters.length;

    // Update simulator base inputs if not focused
    const curCgpaInput = document.getElementById('sim-current-cgpa');
    const curCreditsInput = document.getElementById('sim-completed-credits');
    
    if (document.activeElement !== curCgpaInput) {
        curCgpaInput.value = cgpa.toFixed(2);
    }
    if (document.activeElement !== curCreditsInput) {
        curCreditsInput.value = totalCredits.toFixed(1);
    }

    runSimulatorCalculations();
}

// Validation Helper: toggle visibility of error fields safely
function toggleInputError(inputElement, isValid, errorMessage) {
    const parent = inputElement.closest('.input-wrapper') || inputElement.closest('.input-group');
    if (!parent) return;
    
    const errorSpan = parent.querySelector('.error-text');

    if (!isValid) {
        inputElement.classList.add('input-error');
        if (errorSpan) {
            errorSpan.textContent = errorMessage; // Safe assignment
            errorSpan.classList.remove('hidden');
        }
    } else {
        inputElement.classList.remove('input-error');
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.classList.add('hidden');
        }
    }
}

// Perform Dynamic Simulator Calculations
function runSimulatorCalculations() {
    const simCgpaInput = document.getElementById('sim-current-cgpa');
    const simCreditsInput = document.getElementById('sim-completed-credits');
    const simTargetInput = document.getElementById('sim-target-cgpa');

    const simCgpa = parseFloat(simCgpaInput.value);
    const simCredits = parseFloat(simCreditsInput.value);
    const targetCgpa = parseFloat(simTargetInput.value);

    // Validate sandbox base inputs
    let baseInputsValid = true;
    if (isNaN(simCgpa) || simCgpa < 0 || simCgpa > 10) {
        toggleInputError(simCgpaInput, false, "Must be between 0 and 10");
        baseInputsValid = false;
    } else {
        toggleInputError(simCgpaInput, true);
    }

    if (isNaN(simCredits) || simCredits < 0) {
        toggleInputError(simCreditsInput, false, "Credits must be >= 0");
        baseInputsValid = false;
    } else {
        toggleInputError(simCreditsInput, true);
    }

    if (simTargetInput.value && (isNaN(targetCgpa) || targetCgpa < 0 || targetCgpa > 10)) {
        toggleInputError(simTargetInput, false, "Target must be between 0 and 10");
        baseInputsValid = false;
    } else {
        toggleInputError(simTargetInput, true);
    }

    // Validate future rows
    let rowsValid = true;
    const rows = document.querySelectorAll('.future-sem-row');
    rows.forEach(row => {
        const nameIn = row.querySelector('.fut-sem-name-input');
        const gpaIn = row.querySelector('.fut-sem-gpa-input');
        const creditsIn = row.querySelector('.fut-sem-credits-input');

        const nameVal = nameIn.value.trim();
        const gpaVal = parseFloat(gpaIn.value);
        const creditsVal = parseFloat(creditsIn.value);

        if (!nameVal) {
            toggleInputError(nameIn, false, "Required");
            rowsValid = false;
        } else {
            toggleInputError(nameIn, true);
        }

        if (isNaN(gpaVal) || gpaVal < 0 || gpaVal > 10) {
            toggleInputError(gpaIn, false, "0 to 10");
            rowsValid = false;
        } else {
            toggleInputError(gpaIn, true);
        }

        if (isNaN(creditsVal) || creditsVal <= 0) {
            toggleInputError(creditsIn, false, "Must be > 0");
            rowsValid = false;
        } else {
            toggleInputError(creditsIn, true);
        }
    });

    const gradCreditsDisplay = document.getElementById('graduation-credits-val');
    const projectedMsg = document.getElementById('projected-message');
    const solverContainer = document.getElementById('target-solver-result-container');
    const solverMsg = document.getElementById('target-solver-message');

    if (!baseInputsValid || !rowsValid) {
        gradCreditsDisplay.textContent = '--';
        projectedMsg.textContent = "Please resolve planner errors to calculate projection.";
        projectedMsg.className = 'status-danger';
        solverContainer.classList.add('hidden');
        return;
    }

    // Sum future variables
    let futureCreditsSum = 0;
    let futurePointsWeightedSum = 0;

    state.futureSemesters.forEach(sem => {
        futureCreditsSum += parseFloat(sem.credits) || 0;
        futurePointsWeightedSum += (parseFloat(sem.gpa) || 0) * (parseFloat(sem.credits) || 0);
    });

    const totalGradCredits = simCredits + futureCreditsSum;
    const totalPointsGrad = (simCgpa * simCredits) + futurePointsWeightedSum;
    const projectedCgpa = totalGradCredits > 0 ? (totalPointsGrad / totalGradCredits) : 0;

    gradCreditsDisplay.textContent = totalGradCredits.toFixed(1);
    projectedMsg.textContent = `If you achieve the entered grades, your projected CGPA at graduation will be ${projectedCgpa.toFixed(2)}.`;
    projectedMsg.className = 'status-success';

    // Target CGPA Solver calculation
    if (simTargetInput.value.trim() !== '') {
        solverContainer.classList.remove('hidden');
        
        if (futureCreditsSum <= 0) {
            solverMsg.textContent = "Please add future credits to solve for your target.";
            solverMsg.className = 'status-danger';
            return;
        }

        const requiredPoints = (targetCgpa * totalGradCredits) - (simCgpa * simCredits);
        const requiredAvgGpa = requiredPoints / futureCreditsSum;

        if (targetCgpa <= simCgpa) {
            solverMsg.textContent = "Target already achieved! You need to maintain 0.00 average GPA.";
            solverMsg.className = 'status-success';
        } else if (requiredAvgGpa > 10.0) {
            solverMsg.textContent = "This target is not mathematically possible with the remaining credits because it would require an average GPA above 10.";
            solverMsg.className = 'status-danger';
        } else {
            solverMsg.textContent = `You need to maintain an average of ${requiredAvgGpa.toFixed(2)} GPA across all future credits to achieve your target.`;
            solverMsg.className = 'status-success';
        }
    } else {
        solverContainer.classList.add('hidden');
    }
}

// Validate active semester input form before adding
function validateActiveSemester() {
    let isValid = true;
    
    // Check Semester Name
    const nameInput = document.getElementById('current-semester-name');
    const name = nameInput.value.trim();
    if (!name) {
        toggleInputError(nameInput, false, "Semester name is required");
        isValid = false;
    } else {
        toggleInputError(nameInput, true);
    }

    // Check all subjects
    if (state.currentSubjects.length === 0) {
        alert("Please add at least one subject to the active semester.");
        return false;
    }

    const rows = document.querySelectorAll('#current-subjects-list .subject-row');
    rows.forEach(row => {
        const nameInput = row.querySelector('.sub-name-input');
        const creditsInput = row.querySelector('.sub-credits-input');

        const nameVal = nameInput.value.trim();
        const creditsVal = parseFloat(creditsInput.value);

        if (!nameVal) {
            toggleInputError(nameInput, false, "Subject name required");
            isValid = false;
        } else {
            toggleInputError(nameInput, true);
        }

        if (isNaN(creditsVal) || creditsVal <= 0) {
            toggleInputError(creditsInput, false, "Credits must be > 0");
            isValid = false;
        } else {
            toggleInputError(creditsInput, true);
        }
    });

    return isValid;
}

// Try saving current semester to cumulative history
function addSemesterToCGPA() {
    if (!validateActiveSemester()) {
        return;
    }

    const name = document.getElementById('current-semester-name').value.trim();

    let semPoints = 0;
    let semCredits = 0;

    state.currentSubjects.forEach(sub => {
        const credits = parseFloat(sub.credits);
        const points = parseFloat(sub.gradeValue);
        semPoints += points * credits;
        semCredits += credits;
    });

    const gpa = semCredits > 0 ? (semPoints / semCredits) : 0;

    // Push to history
    state.completedSemesters.push({
        id: `sem-${Date.now()}`,
        name: name,
        gpa: parseFloat(gpa.toFixed(2)),
        credits: parseFloat(semCredits.toFixed(1))
    });

    // Clear active inputs & set up next semester sequence
    const match = name.match(/(\d+)$/);
    if (match) {
        const nextNum = parseInt(match[1]) + 1;
        state.currentSemesterName = name.replace(/\d+$/, nextNum);
    } else {
        state.currentSemesterName = name + " (Next)";
    }
    
    // Reset subjects to 1 empty row
    const grades = getActiveGrades();
    state.currentSubjects = [
        { id: `sub-${Date.now()}`, name: '', credits: 4, gradeLabel: grades[0].label, gradeValue: grades[0].points }
    ];

    document.getElementById('current-semester-name').value = state.currentSemesterName;

    saveState();
    renderCurrentSemester();
    renderHistory();
    calculateResults();
}

// Bind all UI interaction listeners
function setupEventListeners() {
    // Grading System Selector Change Handler
    document.getElementById('grading-system-select').addEventListener('change', (e) => {
        const newSystem = e.target.value;
        const oldSystem = state.gradingSystem;

        if (newSystem === oldSystem) return;

        const hasSubjects = state.currentSubjects.some(sub => sub.name && sub.name.trim() !== "");

        if (hasSubjects) {
            const confirmChange = confirm('Changing the grading system will update/reset all active subject grades. Do you want to proceed?');
            if (!confirmChange) {
                e.target.value = oldSystem;
                return;
            }
        }

        // Apply new grading system
        state.gradingSystem = newSystem;
        const grades = getActiveGrades();
        const defaultGrade = grades[0];

        // Update all current subjects to new default
        state.currentSubjects.forEach(sub => {
            sub.gradeLabel = defaultGrade.label;
            sub.gradeValue = defaultGrade.points;
        });

        saveState();
        renderMappingDisplay();
        renderCurrentSemester();
        calculateResults();
    });

    // Add Current Semester to History Action
    document.getElementById('save-semester-btn').addEventListener('click', addSemesterToCGPA);

    // Add Subject Row button
    document.getElementById('add-subject-btn').addEventListener('click', () => {
        const grades = getActiveGrades();
        const defaultGrade = grades[0];

        state.currentSubjects.push({
            id: `sub-${Date.now()}`,
            name: '',
            credits: 3,
            gradeLabel: defaultGrade.label,
            gradeValue: defaultGrade.points
        });
        saveState();
        renderCurrentSemester();
    });

    // Reset Semester button
    document.getElementById('reset-semester-btn').addEventListener('click', () => {
        const hasData = state.currentSubjects.some(sub => (sub.name && sub.name.trim() !== "") || (sub.credits && parseFloat(sub.credits) > 0));
        
        if (hasData) {
            const confirmReset = confirm('Are you sure you want to reset the current semester inputs? All currently entered subject rows and local calculations will be cleared.');
            if (!confirmReset) return;
        }

        const grades = getActiveGrades();
        state.currentSubjects = [
            { id: `sub-${Date.now()}`, name: '', credits: 4, gradeLabel: grades[0].label, gradeValue: grades[0].points }
        ];
        
        saveState();
        renderCurrentSemester();
        calculateResults();
    });

    // Clear All CGPA Data (History) button
    document.getElementById('reset-history-btn').addEventListener('click', () => {
        const confirmClear = confirm('Are you sure you want to clear all CGPA data? This will permanently delete all completed semesters and reset your running CGPA.');
        if (!confirmClear) return;

        const grades = getActiveGrades();
        state.currentSemesterName = 'Semester 1';
        state.completedSemesters = [];
        state.currentSubjects = [
            { id: `sub-${Date.now()}`, name: '', credits: 4, gradeLabel: grades[0].label, gradeValue: grades[0].points }
        ];
        state.futureSemesters = [
            { id: 'fut-1', name: 'Future Semester 1', gpa: 8.0, credits: 20 }
        ];
        
        document.getElementById('current-semester-name').value = state.currentSemesterName;
        
        saveState();
        renderCurrentSemester();
        renderHistory();
        renderFutureSemesters();
        calculateResults();
    });

    // Input monitoring on current semester
    const listContainer = document.getElementById('current-subjects-list');

    listContainer.addEventListener('input', (e) => {
        const target = e.target;
        const subIdx = parseInt(target.dataset.subIdx);

        if (target.classList.contains('sub-name-input')) {
            const name = target.value;
            state.currentSubjects[subIdx].name = name;
            toggleInputError(target, name.trim() !== "", "Subject name required");
            saveState();
        } else if (target.classList.contains('sub-credits-input')) {
            const credits = parseFloat(target.value);
            state.currentSubjects[subIdx].credits = isNaN(credits) ? "" : credits;
            toggleInputError(target, !isNaN(credits) && credits > 0, "Credits must be > 0");
            saveState();
        }
    });

    // Select grade changes
    listContainer.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('sub-grade-select')) {
            const subIdx = parseInt(target.dataset.subIdx);
            const selectedOption = target.options[target.selectedIndex];

            state.currentSubjects[subIdx].gradeValue = parseFloat(target.value);
            state.currentSubjects[subIdx].gradeLabel = selectedOption.dataset.label;
            saveState();
        }
    });

    // Delete buttons clicked inside active subjects list
    listContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('delete-sub-btn')) {
            const subIdx = parseInt(target.dataset.subIdx);
            state.currentSubjects.splice(subIdx, 1);
            saveState();
            renderCurrentSemester();
        }
    });

    // Delete completed semester buttons inside history list
    document.getElementById('history-list').addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('delete-history-btn')) {
            const idx = parseInt(target.dataset.idx);
            state.completedSemesters.splice(idx, 1);
            saveState();
            renderHistory();
            calculateResults();
        }
    });

    // Semester name edit change handler
    document.getElementById('current-semester-name').addEventListener('input', (e) => {
        const name = e.target.value;
        state.currentSemesterName = name;
        toggleInputError(e.target, name.trim() !== "", "Semester name required");
        saveState();
    });

    // Dynamic Simulator Future Semester Add Row Action
    document.getElementById('add-future-sem-btn').addEventListener('click', () => {
        const nextNum = state.futureSemesters.length + 1;
        state.futureSemesters.push({
            id: `fut-${Date.now()}`,
            name: `Future Semester ${nextNum}`,
            gpa: 8.0,
            credits: 20.0
        });
        saveState();
        renderFutureSemesters();
        runSimulatorCalculations();
    });

    // Dynamic Simulator future semester inputs delegation
    const futureSemList = document.getElementById('future-semesters-list');
    
    futureSemList.addEventListener('input', (e) => {
        const target = e.target;
        const idx = parseInt(target.dataset.idx);

        if (target.classList.contains('fut-sem-name-input')) {
            const name = target.value;
            state.futureSemesters[idx].name = name;
            toggleInputError(target, name.trim() !== "", "Required");
            saveState();
            runSimulatorCalculations();
        } else if (target.classList.contains('fut-sem-gpa-input')) {
            const gpa = parseFloat(target.value);
            state.futureSemesters[idx].gpa = isNaN(gpa) ? "" : gpa;
            toggleInputError(target, !isNaN(gpa) && gpa >= 0 && gpa <= 10, "0 to 10");
            saveState();
            runSimulatorCalculations();
        } else if (target.classList.contains('fut-sem-credits-input')) {
            const credits = parseFloat(target.value);
            state.futureSemesters[idx].credits = isNaN(credits) ? "" : credits;
            toggleInputError(target, !isNaN(credits) && credits > 0, "Must be > 0");
            saveState();
            runSimulatorCalculations();
        }
    });

    futureSemList.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('delete-fut-sem-btn')) {
            const idx = parseInt(target.dataset.idx);
            state.futureSemesters.splice(idx, 1);
            saveState();
            renderFutureSemesters();
            runSimulatorCalculations();
        }
    });

    // Sandbox Base Inputs Monitoring
    document.getElementById('sim-current-cgpa').addEventListener('input', runSimulatorCalculations);
    document.getElementById('sim-completed-credits').addEventListener('input', runSimulatorCalculations);
    document.getElementById('sim-target-cgpa').addEventListener('input', runSimulatorCalculations);
}
