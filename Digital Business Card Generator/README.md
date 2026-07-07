# Digital Business Card Generator

A premium, highly interactive, frontend-only Digital Business Card Generator designed to help you create, customize, and share your professional identity. Built with raw HTML, CSS, and modern vanilla JavaScript.

## Features

1. **Instant Real-Time Preview**: Card updates dynamically while typing details.
2. **Profile Image Upload**: Supports JPG, PNG, and WEBP profile images under 2MB.
3. **Smart Initials Placeholder**: Dynamically generates initials from your full name if no image is uploaded.
4. **4 Premium Responsive Templates**:
   - **Modern Professional**: Deep professional slate layout with custom accents.
   - **Dark Developer**: Monospace font with high-contrast neon accents.
   - **Creative Gradient**: High-energy gradient with smooth rounded aesthetics.
   - **Minimal Clean**: Elegant warm border card with muted organic accents.
5. **Interactive Custom Accent Color**: Seamlessly update the accent colors on the templates.
6. **Smart Social Links Integration**: Social media links appear with their respective symbols (icons) and clean, shortened URL handle text formatted in a small font size when a link is supplied. Link formatting checks auto-resolve protocol prepending (e.g. `linkedin.com` becomes `https://linkedin.com`).
7. **Toggle Controls**: Show/hide contact details or the QR code placeholder.
8. **Toast Notifications**: Interactive status indicators for saving, resetting, image uploads, template switches, and download generation.
9. **Form Validation**: Strict real-time constraints for required name and valid email formats.
10. **High-Resolution PNG Download**: Utilizes `html2canvas` to capture the card preview in double resolution (2x) with clean alpha transparency.
11. **Print & PDF Support**: Responsive `@media print` styling isolates only the business card frame, retaining exact template colors with CSS page-color adjustment rules.
12. **LocalStorage Persistence**: Save configurations locally and auto-restore them on page reload.

## Bugs Resolved

1. **JavaScript loading (404 error)**: Updated HTML to search for `script.js` which is the corrected and integrated JavaScript file (removing the redundant `app.js`).
2. **Email constraint mismatch**: Removed the confusing `required` attributes and labels for Email, ensuring validation only activates when text is typed into the email field.
3. **Corrupted LocalStorage parsing**: Wrapped JSON parser in a try-catch construct to avoid page crashes when corrupted or obsolete local values are read.
4. **Instant auto-save bug**: Removed auto-saving from the preview render loop. Data is now safely saved only when the user explicitly triggers the "Save Details" button.
5. **Real-time field validation**: Added input/change event listeners that clear error flags and boundaries instantly while typing, instead of waiting for a save event.
6. **Debounced Toast messages**: Solved overlapping/interrupted toasts by implementing a clear timeout tracker in the toast renderer.
7. **Print CSS Backgrounds**: Appended `print-color-adjust: exact` and fixed card widths in `@media print` so browsers correctly render and print backgrounds/images instead of empty white cards.
8. **Initial resets**: Solved cases where file input elements and profile visuals didn't reset back to placeholder initials upon clearing.

## How to Run

1. Open this directory using **VS Code**.
2. Run the project using the **Live Server** extension or open the `index.html` file directly in any modern web browser.
