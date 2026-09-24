const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Terminal command execution endpoint
app.post('/api/terminal', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    console.log(`Executing command: ${command}`);

    // Basic security checks
    const dangerousCommands = ['rm -rf', 'sudo rm', 'format', 'del /f', 'shutdown', 'reboot'];
    const isDangerous = dangerousCommands.some(dangerous => command.toLowerCase().includes(dangerous));
    
    if (isDangerous) {
      return res.status(403).json({ 
        error: 'Command blocked for safety reasons',
        message: 'This command could be dangerous and has been blocked'
      });
    }

    const { homedir } = require('os');

    // Execute command with proper error handling in user's home directory
    exec(command, { timeout: 10000, cwd: homedir() }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error for "${command}":`, error);
        return res.status(500).json({ 
          error: error.message,
          output: stderr || 'Command execution failed',
          command: command
        });
      }
      
      const output = stdout || stderr || 'Command executed successfully';
      console.log(`Command "${command}" executed successfully`);
      
      res.json({
        success: true,
        output: output,
        command: command
      });
    });

  } catch (error) {
    console.error('Unexpected error in terminal endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to execute command',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Terminal service is running' });
});

// Search endpoint - proxies DuckDuckGo API to avoid CORS issues
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`Searching: ${query}`);

    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const results = JSON.parse(data);
          console.log(`Search completed for: ${query}`);
          res.json(results);
        } catch (parseError) {
          console.error('Failed to parse DuckDuckGo response:', parseError);
          res.status(500).json({ error: 'Failed to parse search results' });
        }
      });
    }).on('error', (error) => {
      console.error('DuckDuckGo request failed:', error);
      res.status(500).json({ error: 'Search request failed' });
    });

  } catch (error) {
    console.error('Unexpected error in search endpoint:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Terminal service running on http://0.0.0.0:${PORT}`);
  console.log('CORS enabled for all origins');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
  } else {
    console.error('Failed to start terminal server:', err);
  }
});
