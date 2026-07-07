# VisionShift - Color Blindness Simulator

**Creator**: [@sabhya1290](https://github.com/sabhya1290)

VisionShift is a modern, accessibility-focused, frontend-only web application that allows designers, developers, and creators to upload images and simulate how they appear to users with different color vision deficiencies (CVD).

By testing designs under simulated vision modes, you can build inclusive products that accommodate diverse visual capabilities.

## Features

- **Drag-and-Drop Upload**: Instantly upload images using drag-and-drop or the traditional file picker.
- **Multiple Simulator Views**:
  - **Side-by-Side**: View the original and simulated image side-by-side.
  - **Compare Slider**: Drag an interactive slider left or right over the image to perform a split-screen comparison.
- **Interactive Vision Deficiencies Simulation**: Immediately switch between five vision modes.
- **Grayscale Conversion**: Grayscale matrix simulation for Achromatopsia.
- **Responsive Layout**: Works seamlessly on desktop, tablets, and mobile devices.
- **Accessibility Features**: Keyboard accessible controls, semantic HTML, ARIA attributes, and focus indicators.
- **Download Simulation**: Export the simulated version as a high-quality PNG.

## Supported Modes

1. **Normal Vision**: Baseline standard color perception.
2. **Protanopia**: Red-blindness (missing L-cones). Individuals see greens/reds as muted and dark.
3. **Deuteranopia**: Green-blindness (missing M-cones). The most common type of CVD.
4. **Tritanopia**: Blue-blindness (missing S-cones). Mutes blue, yellow, and violet wavelengths.
5. **Achromatopsia**: Complete color blindness (monochromacy). Users see only black, white, and shades of gray.

## How to Run

1. Clone or download this project's files.
2. Locate the [index.html](file:///d:/project/COSC Hackweek/Color Blindness Simulator/index.html) file.
3. Double-click `index.html` to open it in any web browser, or use a local development server like VS Code's **Live Server** extension.

## How the Canvas Color Transformation Works

The simulator leverages HTML5 Canvas API and JavaScript for client-side processing:

1. **File Reading**: The uploaded image is read into memory as a Data URL via `FileReader`.
2. **Canvas Rendering**: The image is drawn to a `<canvas>` element.
3. **Pixel Manipulation**: `getImageData()` extracts the raw RGBA pixel array.
4. **Matrix multiplication**: For each pixel, a transformation matrix is applied to the red, green, and blue values:
   
   $$\begin{bmatrix} R' \\ G' \\ B' \end{bmatrix} = \begin{bmatrix} m_{00} & m_{01} & m_{02} \\ m_{10} & m_{11} & m_{12} \\ m_{20} & m_{21} & m_{22} \end{bmatrix} \begin{bmatrix} R \\ G \\ B \end{bmatrix}$$

   For example, for **Protanopia**:
   - $R' = 0.567 \cdot R + 0.433 \cdot G$
   - $G' = 0.558 \cdot R + 0.442 \cdot G$
   - $B' = 0.242 \cdot G + 0.758 \cdot B$
   
5. **Clamping & Display**: RGB values are clamped between 0 and 255, and the simulated image is written back using `putImageData()`.
