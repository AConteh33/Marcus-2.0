<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Marcus AI Assistant

This is an advanced AI assistant with main AI capabilities for real-time interactions. The system includes sophisticated file search functionality that allows the AI to locate files without knowing exact paths.

View your app in AI Studio: https://ai.studio/apps/drive/1HmSWsozHb3m9gyEjOuRvNTXQcgBuQmtU

## Features

- **Advanced AI System**: Main AI for real-time interactions with comprehensive capabilities
- **Advanced File Search**: Search for files using pattern matching, fuzzy matching, and recursive directory traversal
- **File Location Awareness**: The AI now understands file locations before attempting to open them
- **Terminal Integration**: Execute system commands securely through the terminal tool

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## File Search Capabilities

The AI can now search for files using the `searchFiles` tool with the following parameters:
- `searchTerm`: The search term to look for (supports wildcards like * and ?)
- `searchPath`: The directory path to search in (defaults to current directory)
- `recursive`: Whether to search recursively in subdirectories (default: true)
- `fileExtensions`: Array of file extensions to filter by
- `maxResults`: Maximum number of results to return (default: 50)

The search tool returns complete file paths that can be used to locate files before opening them, ensuring the AI knows exactly where files are located.
