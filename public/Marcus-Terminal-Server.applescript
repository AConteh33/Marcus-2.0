-- Marcus AI Terminal Server Manager
-- Download and run this with: osascript Marcus-Terminal-Server.applescript

on run
    display dialog "Marcus AI Terminal Server Manager" buttons {"Start Server", "Stop Server", "Check Status", "Cancel"} default button "Start Server"
    
    set button_choice to button returned of the result
    
    if button_choice is "Start Server" then
        -- Check if Node.js is installed
        try
            do shell script "node --version"
        on error
            display dialog "Node.js is not installed. Please install Node.js first from https://nodejs.org" buttons {"OK"} default button "OK"
            return
        end try
        
        -- Create marcus-ai directory
        do shell script "mkdir -p ~/marcus-ai"
        
        -- Download terminal server
        try
            do shell script "cd ~/marcus-ai && curl -o terminal-server.cjs https://marcus-ai-fb9bb.web.app/terminal-server.cjs"
            display dialog "Terminal server downloaded successfully!" buttons {"OK"} default button "OK"
        on error
            display dialog "Failed to download terminal server. Please check your internet connection." buttons {"OK"} default button "OK"
            return
        end try
        
        -- Start the server
        try
            do shell script "cd ~/marcus-ai && node terminal-server.cjs > /dev/null 2>&1 &"
            display dialog "Terminal server started successfully! 🚀

Server is running on: http://localhost:3001

You can now use terminal commands in Marcus AI!

To stop the server, run this app again and click 'Stop Server'." buttons {"OK"} default button "OK"
        on error
            display dialog "Failed to start terminal server. Please check if port 3001 is already in use." buttons {"OK"} default button "OK"
        end try
        
    else if button_choice is "Stop Server" then
        try
            do shell script "pkill -f terminal-server"
            display dialog "Terminal server stopped successfully!" buttons {"OK"} default button "OK"
        on error
            display dialog "No terminal server process found to stop." buttons {"OK"} default button "OK"
        end try
        
    else if button_choice is "Check Status" then
        try
            set server_status to do shell script "curl -s http://localhost:3001/api/health 2>/dev/null || echo 'Not running'"
            if server_status contains "Terminal service is running" then
                display dialog "✅ Terminal Server Status: RUNNING

Server is active on: http://localhost:3001
Marcus AI terminal commands are working!" buttons {"OK"} default button "OK"
            else
                display dialog "❌ Terminal Server Status: NOT RUNNING

Server is not responding on: http://localhost:3001
Click 'Start Server' to begin." buttons {"OK"} default button "OK"
            end if
        on error
            display dialog "❌ Terminal Server Status: NOT RUNNING

Server is not responding on: http://localhost:3001
Click 'Start Server' to begin." buttons {"OK"} default button "OK"
        end try
        
    end if
end run
