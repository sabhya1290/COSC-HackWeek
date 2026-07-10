# DocuMind - Local Document Question-Answering System

DocuMind is a local RAG-style (Retrieval-Augmented Generation) document Q&A system. It allows users to upload PDF, TXT, MD, and JSON documents, retrieves relevant text chunks based on user questions using a local TF-IDF (Term Frequency-Inverse Document Frequency) cosine similarity implementation, and sends the matching context to a local Ollama model to generate precise, document-grounded answers.

## Flow of the Application
1. **Upload**: User uploads PDF, TXT, MD, or JSON files.
2. **Parse**: Files are parsed on the backend (using `pdf-parse` for PDFs, native parsing for JSON structure, and standard file reading for TXT/MD).
3. **Chunk**: Parsed text is split into overlapping chunks of approximately 500 characters along sentence boundaries to preserve readability.
4. **Retrieve**: When a question is asked, the system converts the question and all text chunks into TF-IDF weighted vectors, computes cosine similarity, and selects the top 3 most relevant chunks.
5. **Context Generation**: The top chunks are sent to the local Ollama API along with the question.
6. **Answer Generation**: The Ollama LLM generates an answer, which is returned along with the exact source documents and matching text excerpts.


## Prerequisites
- **Node.js** (v16 or higher)
- **Ollama** installed locally

## Ollama Setup
1. Pull the default model (gemma4:e4b or llama3.2):
   ```bash
   ollama pull llama3.2
   # or the specific model you have, e.g. gemma4:e4b
   ollama pull gemma4:e4b
   ```
2. Make sure Ollama server is running:
   ```bash
   ollama serve
   ```

## Server Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Express backend:
   ```bash
   npm start
   ```
   *The server runs on port 5000 by default.*

## Client Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React frontend:
   ```bash
   npm run dev
   ```
   *The client will start, usually on `http://localhost:5173`.*

## Supported File Types and Limitations
- **Supported Formats**: `.pdf` (PDF), `.txt` (Plain Text), `.md` (Markdown), and `.json` (JSON).
- **File Size Limitation**: Recommended max size per file is 10MB to maintain responsive local parsing.
- **In-Memory Storage**: Uploaded documents and computed chunks are stored in server memory. **They are cleared when the server is restarted.**

## Troubleshooting
- **Ollama Connection Errors**: Ensure Ollama is running at `http://localhost:11434` (try visiting it in your browser). Check that the `OLLAMA_MODEL` environment variable in the backend matches the model you have pulled in Ollama.
- **PDF Parsing Errors**: Scanned images/PDFs without OCR text layers cannot be read, as `pdf-parse` extracts text characters directly.
