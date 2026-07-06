# GPA & CGPA Calculator

A simple, responsive GPA and CGPA calculator built for students. It supports multiple grading systems, semester-wise CGPA tracking, and a **What-If Planner** to estimate the CGPA you can achieve by graduation.

## Features

- Calculate semester GPA from subjects, credits, and grades
- Track completed semesters and calculate weighted running CGPA
- Choose between Standard Indian 10-Point and Double-Letter College grading systems
- Add and remove subjects dynamically
- Add future semesters to estimate projected final CGPA
- Enter a target CGPA to see the average GPA needed in remaining semesters
- Responsive design for mobile, tablet, and desktop
- Works fully in the browser with no backend or external API

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript

## How to Run

1. Download or clone this repository.
2. Keep these files in the same folder:

```text
index.html
style.css
app.js
```

3. Open `index.html` in a modern web browser.

No installation, server, or internet connection is required.

## GPA Formula

```text
Semester GPA = Σ (Subject Credits × Grade Points) ÷ Σ Subject Credits
```

## CGPA Formula

```text
CGPA = Σ (Semester GPA × Semester Credits) ÷ Σ Semester Credits
```

CGPA is credit-weighted, so semesters with more credits have a greater effect on the final CGPA.

## Projected CGPA Formula

```text
Projected CGPA =
(Current CGPA × Completed Credits + Σ(Expected Future GPA × Future Semester Credits))
÷
(Completed Credits + Σ Future Semester Credits)
```

## Example

If Semester 1 has 20 credits and GPA 8.50, while Semester 2 has 22 credits and GPA 9.00:

```text
CGPA = ((8.50 × 20) + (9.00 × 22)) ÷ (20 + 22)
CGPA = 368 ÷ 42
CGPA = 8.76
```

## Grade Systems

### Standard Indian 10-Point System

| Grade | Grade Point |
| --- | ---: |
| O | 10 |
| A+ | 9 |
| A | 8 |
| B+ | 7 |
| B | 6 |
| C | 5 |
| P | 4 |
| F | 0 |
| Absent | 0 |

### Double-Letter College System

| Grade | Grade Point |
| --- | ---: |
| AA | 10 |
| AB | 9 |
| BB | 8 |
| BC | 7 |
| CC | 6 |
| CD | 5 |
| DD | 4 |
| FP | 0 |
| FA | 0 |

## What-If Planner

Enter your current CGPA and completed credits, then add future semesters with expected GPA and credits. The calculator shows the projected final CGPA and can calculate the average GPA needed to reach an optional target CGPA.

If the required average is above 10, the target is not mathematically possible with the remaining credits.

## Data Storage

Completed semesters and the selected grading system are saved in your browser using `localStorage`.

- Data remains after refreshing the page.
- Data stays on the same browser and device.
- Use **Clear All CGPA Data** to remove saved data.

## Folder Structure

```text
COSC-HackWeek/
├── index.html
├── style.css
├── app.js
└── README.md
```
