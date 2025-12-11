# Resume RAG Bot (Powered by Gemini 2.5)

A professional-grade Resume Analysis chatbot that uses Retrieval-Augmented Generation (RAG) principles to interview PDF resumes. It leverages **Google Gemini 2.5 Flash** for high-speed analysis and "Thinking" capabilities for deep critiques.

## 🌟 Features

*   **PDF & Text Ingestion**: securely parses resume files entirely in the browser (no server storage).
*   **Structured Intelligence**: Automatically extracts:
    *   Candidate Name
    *   Executive Summary
    *   Top Skills (ranked)
    *   Suggested Interview Questions (tailored to gaps)
*   **Dual-Pane Interface**: Chat on the left, structured insights on the right.
*   **Deep Critique Mode**: Uses Gemini's `thinkingConfig` to perform a ruthless, recruiter-level analysis of resume red flags, gaps, and formatting issues.
*   **PWA Ready**: Installable as a native-like app on Desktop and Mobile.
*   **Privacy First**: Files are processed in memory; only text chunks are sent to the LLM API.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   A Google Cloud Project with the Gemini API enabled.
*   An API Key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  **Clone the repository** (or download the files).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
    *Note: This project uses `esm.sh` for frontend dependencies in `index.html`, so local `npm install` is primarily for tooling if you were using a bundler, but this specific setup runs directly in environments like StackBlitz or Replit.*

3.  **Set Environment Variables**:
    Create a `.env` file (or set in your environment):
    ```bash
    API_KEY=your_gemini_api_key_here
    ```

### Running the App

```bash
npm start
# or
vite
```

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **AI**: Google GenAI SDK (`@google/genai`)
*   **PDF Processing**: `pdfjs-dist` (via Worker)
*   **Icons**: Lucide React

## 📱 Progressive Web App (PWA)

This application includes a Service Worker (`sw.js`) and Manifest (`manifest.json`).
*   **Offline Support**: Caches core assets.
*   **Installable**: Click the "Install App" button in the header (Chrome/Edge/Android).

## 💡 Usage Guide

1.  **Upload**: Drag & Drop a PDF resume.
2.  **Review Insights**: The right panel populates with a summary and generated questions immediately.
3.  **Chat**: Ask questions like "Does he have leadership experience?" or "Explain the gap in 2022."
4.  **Deep Dive**: Click "Perform Deep Critique" to get a strict evaluation of the candidate's weaknesses.

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License.
