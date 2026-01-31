const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const cors = require('cors');

const execAsync = promisify(exec);
const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Electron screenshot endpoint
app.post('/api/electron-screenshot', async (req, res) => {
    try {
        const { savePath, screenIndex, windowTitle } = req.body;
        
        // Determine save path
        let screenshotPath;
        if (savePath) {
            screenshotPath = savePath;
        } else {
            const tempDir = os.tmpdir();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            screenshotPath = path.join(tempDir, `electron-screenshot-${timestamp}.png`);
        }

        // Try to use Electron's desktopCapturer if available
        let result;
        try {
            // Check if we're in Electron environment
            if (process.versions && process.versions.electron) {
                // Use Electron's desktopCapturer
                const { desktopCapturer } = require('electron');
                const sources = await desktopCapturer.getSources({ 
                    types: ['screen'], 
                    thumbnailSize: { width: 1920, height: 1080 }
                });
                
                if (sources.length > 0) {
                    const source = sources[parseInt(screenIndex) || 0];
                    const fs = require('fs');
                    
                    // Convert thumbnail to PNG and save
                    const buffer = source.thumbnail.toPNG();
                    await fs.promises.writeFile(screenshotPath, buffer);
                    
                    result = `Electron screenshot saved to: ${screenshotPath}\n`;
                    result += `Captured screen: ${source.name}\n`;
                    result += `Resolution: ${source.thumbnail.width}x${source.thumbnail.height}\n`;
                } else {
                    throw new Error('No screen sources found');
                }
            } else {
                throw new Error('Not running in Electron environment');
            }
        } catch (electronError) {
            // Fallback to system screenshot commands
            console.log('Electron desktopCapturer not available, using system fallback:', electronError.message);
            
            const platform = os.platform();
            let command;

            if (platform === 'darwin') {
                // macOS
                command = `screencapture -x -t png "${screenshotPath}"`;
            } else if (platform === 'win32') {
                // Windows
                command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds | ForEach-Object { $bitmap = New-Object System.Drawing.Bitmap($_.Width, $_.Height); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($_.X, $_.Y, 0, 0, $_.Width, $_.Height); $bitmap.Save('${screenshotPath}', [System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $bitmap.Dispose() }"`;
            } else {
                // Linux
                command = `import -window root -format png "${screenshotPath}"`;
            }

            // Execute screenshot command
            await execAsync(command);
            result = `System fallback screenshot saved to: ${screenshotPath}\n`;
            result += `Method: ${platform} system command\n`;
        }

        // Verify screenshot was created
        const stats = await fs.stat(screenshotPath);
        if (!stats.isFile()) {
            throw new Error('Screenshot file was not created');
        }

        // Examine screenshot for open windows
        const analysis = await examineScreenshot(screenshotPath);
        result += `\n${analysis}`;

        res.json({ success: true, result });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Electron screenshot API error:', errorMessage);
        res.status(500).json({ error: `Failed to take Electron screenshot: ${errorMessage}` });
    }
});

// Screenshot endpoint
app.post('/api/screenshot', async (req, res) => {
    try {
        const { savePath } = req.body;
        
        // Determine save path
        let screenshotPath;
        if (savePath) {
            screenshotPath = savePath;
        } else {
            const tempDir = os.tmpdir();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            screenshotPath = path.join(tempDir, `screenshot-${timestamp}.png`);
        }

        // Take screenshot based on OS
        const platform = os.platform();
        let command;

        if (platform === 'darwin') {
            // macOS
            command = `screencapture -x -t png "${screenshotPath}"`;
        } else if (platform === 'win32') {
            // Windows
            command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds | ForEach-Object { $bitmap = New-Object System.Drawing.Bitmap($_.Width, $_.Height); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($_.X, $_.Y, 0, 0, $_.Width, $_.Height); $bitmap.Save('${screenshotPath}', [System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $bitmap.Dispose() }"`;
        } else {
            // Linux
            command = `import -window root -format png "${screenshotPath}"`;
        }

        // Execute screenshot command
        await execAsync(command);

        // Verify screenshot was created
        const stats = await fs.stat(screenshotPath);
        if (!stats.isFile()) {
            throw new Error('Screenshot file was not created');
        }

        let result = `Screenshot saved to: ${screenshotPath}\n`;

        // Examine screenshot for open windows
        const analysis = await examineScreenshot(screenshotPath);
        result += `\n${analysis}`;

        res.json({ success: true, result });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Screenshot API error:', errorMessage);
        res.status(500).json({ error: `Failed to take screenshot: ${errorMessage}` });
    }
});

async function examineScreenshot(screenshotPath) {
    try {
        // Use system commands to get window information
        const platform = os.platform();
        let windowInfo = '';

        if (platform === 'darwin') {
            // macOS
            try {
                const { stdout } = await execAsync('osascript -e \'tell application "System Events" to get name of every process whose background only is false\'');
                const processes = stdout.trim().split(', ').map(p => p.replace(/"/g, '').trim());
                windowInfo = `Active applications: ${processes.slice(0, 10).join(', ')}`;
            } catch (e) {
                windowInfo = 'Could not retrieve active applications';
            }
        } else if (platform === 'win32') {
            // Windows
            try {
                const { stdout } = await execAsync('tasklist /fo csv | findstr /v "Image Name"');
                const processes = stdout.split('\n')
                    .filter(line => line.trim())
                    .slice(0, 10)
                    .map(line => line.split(',')[0].replace(/"/g, '').trim());
                windowInfo = `Active processes: ${processes.join(', ')}`;
            } catch (e) {
                windowInfo = 'Could not retrieve active processes';
            }
        } else {
            // Linux
            try {
                const { stdout } = await execAsync('ps aux | head -20');
                windowInfo = `Top processes:\n${stdout}`;
            } catch (e) {
                windowInfo = 'Could not retrieve process information';
            }
        }

        return windowInfo;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Screenshot examination error:', errorMessage);
        return `Failed to examine screenshot: ${errorMessage}`;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Screenshot service is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Screenshot server running on http://localhost:${PORT}`);
});
