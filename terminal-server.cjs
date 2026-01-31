const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'], // Allow Vite dev server
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

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

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep server running
});

// Start server with error handling
app.listen(PORT, () => {
  console.log(`Terminal service running on http://localhost:${PORT}`);
  console.log('CORS enabled for: http://localhost:5173, http://localhost:3000, http://127.0.0.1:5173, http://127.0.0.1:3000');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
  } else {
    console.error('Failed to start terminal server:', err);
  }
});
