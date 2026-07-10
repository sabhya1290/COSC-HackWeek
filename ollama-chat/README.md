# OllamaChat 🦙

OllamaChat is a modern, responsive full-stack developer-tool style web application designed to run and chat with a locally running Ollama LLM. The project uses React + Vite for the frontend and Node.js + Express for the backend, communicating with Ollama's local REST API.

---

## 🛠️ Prerequisites

Before you run OllamaChat, ensure you have the following installed:
1. **Node.js** (v18.0.0 or higher is recommended)
2. **Ollama** (locally installed on your operating system)

---

## 🚀 Setting Up Ollama

### 1. Download & Install Ollama
Download and install the native installer for your operating system:
* [Download Ollama for macOS / Windows / Linux](https://ollama.com/download)

### 2. Start Ollama Service
You can start the background service by launching the installed Ollama desktop app, or by running the following command in a separate terminal:
```bash
ollama serve
```

### 3. Pull a Model
Pull the desired default model (e.g., `llama3.2`) to your local machine:
```bash
ollama pull llama3.2
```
*Note: You can also use other models like `mistral`, `gemma`, or `phi3`. If you change the model, make sure to update the server env variables.*

---

## 💻 Running the Application

Follow these steps to spin up the local Express backend server and the React Vite client dev server:

### 1. Start the Backend Server
Open a terminal window and navigate to the `server` directory:
```bash
cd server
npm install
npm start
```
The server will start on port `5000` by default.

### 2. Start the Frontend Client
Open another terminal window and navigate to the `client` directory:
```bash
cd client
npm install
npm run dev
```
The dev server will boot up and provide a local link (typically `http://localhost:5173`). Open that URL in your browser.

---

## ⚙️ Environment Variables (Server)

You can configure the server settings by creating a `.env` file in the `server` directory (copied from `.env.example`):
* `PORT`: Port on which the Express server runs (default: `5000`).
* `OLLAMA_MODEL`: The local model that Ollama will run (default: `llama3.2`).

---

## 🔧 Troubleshooting

### ❌ Error: "Ollama connection refused" or "Unable to connect to Ollama"
This error indicates that the Express server cannot find the Ollama service running on `http://localhost:11434`.
* **Fix**: Ensure that Ollama is actively running. Run `ollama serve` in a terminal or verify that the Ollama taskbar agent is running. You can check if the API is responsive by navigating to `http://localhost:11434` in your browser (it should show "Ollama is running").

### ❌ Error: "Model not found" or "The model 'llama3.2' could not be found"
This means the Ollama application is active, but the model specified by `OLLAMA_MODEL` hasn't been downloaded.
* **Fix**: Run `ollama pull llama3.2` (or the respective model name you set in `.env`) in your terminal to download the weights.

### ❌ Error: "Vite dev server doesn't connect to backend"
* **Fix**: Ensure your backend Express server is running on port `5000`. If you chose to change the backend port, create a `.env` file inside the `client` folder and configure `VITE_API_URL=http://localhost:<YOUR_PORT>`.
