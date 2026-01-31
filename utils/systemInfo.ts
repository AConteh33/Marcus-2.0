import { homedir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * Utility functions to get system information including directories and open windows
 */

/**
 * Get standard user directories based on the operating system
 */
export function getUserDirectories(): Record<string, string> {
  const os = process.platform;
  const homeDir = homedir();
  
  let directories: Record<string, string> = {
    home: homeDir
  };
  
  if (os === 'darwin') { // macOS
    directories = {
      ...directories,
      documents: join(homeDir, 'Documents'),
      downloads: join(homeDir, 'Downloads'),
      desktop: join(homeDir, 'Desktop'),
      pictures: join(homeDir, 'Pictures'),
      music: join(homeDir, 'Music'),
      videos: join(homeDir, 'Movies'),
      recent: join(homeDir, 'Library', 'Application Support', 'Recent Items') // macOS doesn't have a standard "recent" folder
    };
  } else if (os === 'win32') { // Windows
    const userProfile = process.env.USERPROFILE || homeDir;
    directories = {
      ...directories,
      documents: process.env.USERPROFILE ? join(userProfile, 'Documents') : join(homeDir, 'Documents'),
      downloads: process.env.USERPROFILE ? join(userProfile, 'Downloads') : join(homeDir, 'Downloads'),
      desktop: process.env.USERPROFILE ? join(userProfile, 'Desktop') : join(homeDir, 'Desktop'),
      pictures: process.env.USERPROFILE ? join(userProfile, 'Pictures') : join(homeDir, 'Pictures'),
      music: process.env.USERPROFILE ? join(userProfile, 'Music') : join(homeDir, 'Music'),
      videos: process.env.USERPROFILE ? join(userProfile, 'Videos') : join(homeDir, 'Videos'),
      recent: process.env.APPDATA ? join(process.env.APPDATA, 'Microsoft', 'Windows', 'Recent') : join(homeDir, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Recent')
    };
  } else { // Linux and other Unix-like systems
    directories = {
      ...directories,
      documents: process.env.XDG_DOCUMENTS_DIR || join(homeDir, 'Documents'),
      downloads: process.env.XDG_DOWNLOAD_DIR || join(homeDir, 'Downloads'),
      desktop: process.env.XDG_DESKTOP_DIR || join(homeDir, 'Desktop'),
      pictures: process.env.XDG_PICTURES_DIR || join(homeDir, 'Pictures'),
      music: process.env.XDG_MUSIC_DIR || join(homeDir, 'Music'),
      videos: process.env.XDG_VIDEOS_DIR || join(homeDir, 'Videos'),
      recent: join(homeDir, '.local', 'share', 'recently-used.xbel') // Linux doesn't have a standard "recent" folder, using the recently used file
    };
  }
  
  return directories;
}

/**
 * Get contents of a directory
 */
export function getDirectoryContents(dirPath: string, maxItems: number = 10): string[] {
  try {
    if (process.platform === 'win32') {
      // Use PowerShell on Windows to list directory contents
      const result = execSync(`powershell.exe -Command "Get-ChildItem '${dirPath}' | Select-Object Name, Length, Mode | Out-String"`, { 
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'ignore'] 
      }).toString();
      
      // Parse the PowerShell output to extract just the names
      const lines = result.split('\n');
      const items: string[] = [];
      
      for (let i = 3; i < lines.length && items.length < maxItems; i++) { // Skip header lines
        const line = lines[i].trim();
        if (line && !line.includes('---')) {
          const parts = line.trim().split(/\s+/);
          if (parts[0]) {
            items.push(parts[0]); // First part is usually the name
          }
        }
      }
      
      return items;
    } else {
      // Use ls command on Unix-like systems
      const result = execSync(`ls -la "${dirPath}"`, { 
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'ignore'] 
      }).toString();
      
      // Parse the ls output to extract just the names
      const lines = result.split('\n');
      const items: string[] = [];
      
      for (let i = 1; i < lines.length && items.length < maxItems; i++) { // Skip first line (total)
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(/\s+/);
          if (parts.length >= 9) {
            const itemName = parts[8]; // The 9th field is usually the filename
            if (itemName !== '.' && itemName !== '..') {
              items.push(itemName);
            }
          }
        }
      }
      
      return items;
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

/**
 * Get open windows/processes based on the operating system
 */
export function getOpenWindows(): string[] {
  try {
    const os = process.platform;
    let result: string;
    
    if (os === 'darwin') { // macOS
      result = execSync('osascript -e \'tell application "System Events" to get name of every process whose background only is false\'', { 
        timeout: 5000 
      }).toString();
    } else if (os === 'win32') { // Windows
      result = execSync('tasklist /fo csv /nh', { 
        timeout: 5000 
      }).toString();
    } else { // Linux
      result = execSync('wmctrl -l', { 
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'ignore'] // Suppress errors if wmctrl is not installed
      }).toString().catch(() => {
        // Fallback to listing running processes if wmctrl is not available
        return execSync('ps aux | head -20', { timeout: 5000 }).toString();
      }) as string;
    }
    
    // Parse the result based on OS
    if (os === 'win32') {
      // Parse CSV output from tasklist, extract just the image name (first column)
      return result
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const match = line.match(/^"([^"]+)"/); // Get the first quoted field
          return match ? match[1] : line.split(',')[0].replace(/"/g, '');
        })
        .filter(app => app && !app.includes('tasklist')) // Exclude the tasklist command itself
        .slice(0, 15); // Limit to 15 items
    } else if (os === 'darwin') {
      // Parse macOS process names
      return result
        .replace(/\n$/, '') // Remove trailing newline
        .split(', ')
        .map(name => name.replace(/"/g, '').trim())
        .filter(name => name && name.length > 0)
        .slice(0, 15); // Limit to 15 items
    } else {
      // Parse Linux window titles or process names
      return result
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          if (os === 'linux') {
            // If using wmctrl, the format is "0x{id} {display} {title}"
            const parts = line.split(/\s+/);
            return parts.slice(2).join(' '); // Join the title parts
          } else {
            // If using ps, get the command name
            const parts = line.split(/\s+/);
            return parts[10] ? parts[10] : parts[parts.length - 1]; // Usually the command is at the end
          }
        })
        .filter(title => title && title.length > 0 && !title.includes('wmctrl') && !title.includes('ps'))
        .slice(0, 15); // Limit to 15 items
    }
  } catch (error) {
    console.error('Error getting open windows:', error);
    return [];
  }
}

/**
 * Get system information including directories and their contents
 */
export function getSystemInfo(): string {
  const directories = getUserDirectories();
  const infoParts: string[] = [];
  
  infoParts.push("## SYSTEM INFORMATION");
  infoParts.push("");
  infoParts.push("### AVAILABLE DIRECTORIES:");
  
  // Get info for key directories
  const keyDirs = ['documents', 'downloads', 'desktop', 'recent'];
  for (const dirName of keyDirs) {
    if (directories[dirName]) {
      infoParts.push(`- ${dirName.toUpperCase()}: ${directories[dirName]}`);
      
      // Get contents of the directory
      const contents = getDirectoryContents(directories[dirName], 5); // Get first 5 items
      if (contents.length > 0) {
        infoParts.push(`  Contents: ${contents.join(', ')}`);
      } else {
        infoParts.push(`  Contents: [Directory is empty or inaccessible]`);
      }
      infoParts.push("");
    }
  }
  
  // Add open windows information
  const openWindows = getOpenWindows();
  if (openWindows.length > 0) {
    infoParts.push("### OPEN WINDOWS/APPLICATIONS:");
    openWindows.forEach(window => {
      infoParts.push(`- ${window}`);
    });
    infoParts.push("");
  }
  
  return infoParts.join('\n');
}