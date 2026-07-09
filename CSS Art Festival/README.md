# CSS Art Festival — Pixel Panda DJ

A creative, responsive single-page CSS art showcase featuring **Pixel Panda DJ** performing on a vibrant, neon night festival stage. 

🏆 This project is built to showcase advanced styling capabilities, specifically handcrafted for pure CSS art challenges and competitions.

## 🚫 Zero Asset Guarantee
- **NO** Image Tags (`<img>`)
- **NO** SVGs (inline, file, or background URLs)
- **NO** Canvas API
- **NO** JavaScript
- **NO** Icon Libraries
- **NO** Art Generators

Every shape, glow, gradient, and animation is written manually from scratch using semantic HTML and CSS properties.

---

## 🎨 Key CSS Techniques Used

1. **Responsive Container Scaling**: Used modern CSS Container Queries (`cqw` units) to anchor sizes and positions relative to the canvas inline-size, allowing the entire artwork to scale responsively and fit perfectly on desktop, tablet, and mobile displays.
2. **Absolute Positioning & Layering**: Stretched and ordered layers (`z-index`) to arrange the star layers, moon shadow, clouds, laser beams, mountains, character anatomy, headphones, and the DJ console in the foreground.
3. **Advanced CSS Gradients**: Combined radial and linear gradients to craft:
   - Deep night-sky ambient lighting.
   - Concentric vinyl record grooves.
   - Sweepable volumetric laser beams.
   - Realistic 3D metallic volume knobs.
4. **Border Radius Artistry**: Configured precise elliptical border-radii (`border-radius: 50% 50% 45% 45%` etc.) to draw the panda's face, body, arms, ears, and headphones.
5. **Keyframe Animations**: Designed looping CSS `@keyframes` to bring the festival alive:
   - **Blinking Eyes**: Using `scaleY` transitions inside the eye patches.
   - **Bouncing Headphones**: Simulating head bobbing and physical vibrations.
   - **Spinning Vinyl Platter**: Utilizing a linear `360deg` rotation.
   - **Flashing VU Meters & Buttons**: Blinking neon green, yellow, and red indicator lights.
   - **Sweep Lasers**: Pendulum rotations that scale and fade.
   - **Drifting Music Notes & Confetti**: Floating upward and falling downward while rotating.

---

## 🚀 How to Run Locally

Since there are no backend servers or JavaScript frameworks, running the project is simple:

1. Clone or download this repository.
2. Navigate to the `COSC Hackweek/CSS Art Festival` directory.
3. Double-click [index.html](index.html) or open it directly in any modern web browser (Chrome, Safari, Firefox, Edge).

---

## 🌐 Deployment Steps for GitHub Pages

Deploy this pure CSS project to GitHub Pages in seconds:

1. Make sure your project is tracked by git and pushed to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of CSS Art Festival"
   git branch -M main
   git remote add origin https://github.com/your-username/css-art-festival.git
   git push -u origin main
   ```
2. Navigate to your repository page on GitHub.
3. Click on the **Settings** tab.
4. In the left-hand menu, under the "Code and automation" section, click on **Pages**.
5. Under **Build and deployment**, select **Deploy from a branch** under Source.
6. Under **Branch**, select `main` (or whichever branch you pushed to) and the `/ (root)` folder.
7. Click **Save**.
8. After a minute, refresh the settings page or check the GitHub Actions tab to get your live deployment link (e.g., `https://your-username.github.io/css-art-festival/`).
