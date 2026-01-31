#!/bin/bash

# Marcus AI Terminal Server Manager
# Make executable with: chmod +x marcus-terminal-server-manager.sh

show_menu() {
    clear
    echo "========================================"
    echo "  Marcus AI Terminal Server Manager"
    echo "========================================"
    echo "1. Start Server"
    echo "2. Stop Server"
    echo "3. Check Status"
    echo "4. Exit"
    echo ""
}

start_server() {
    echo ""
    echo "Checking Node.js..."
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed!"
        echo "Please install Node.js from: https://nodejs.org"
        read -p "Press Enter to continue..."
        return
    fi
    
    echo "✅ Node.js found: $(node --version)"
    
    echo ""
    echo "Creating directory..."
    mkdir -p ~/marcus-ai
    cd ~/marcus-ai
    
    echo ""
    echo "Downloading terminal server..."
    if curl -o terminal-server.cjs https://marcus-ai-fb9bb.web.app/terminal-server.cjs; then
        echo "✅ Terminal server downloaded successfully!"
    else
        echo "❌ Failed to download terminal server"
        echo "Please check your internet connection"
        read -p "Press Enter to continue..."
        return
    fi
    
    echo ""
    echo "Starting server..."
    chmod +x terminal-server.cjs
    
    # Check if port 3001 is already in use
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️ Port 3001 is already in use. Killing existing process..."
        pkill -f terminal-server
        sleep 2
    fi
    
    echo "🚀 Terminal server started!"
    echo "Server is running on: http://localhost:3001"
    echo ""
    echo "You can now use terminal commands in Marcus AI!"
    echo ""
    echo "To stop the server, press Ctrl+C or run this script again and choose option 2."
    echo ""
    
    # Start server in foreground
    node terminal-server.cjs
}

stop_server() {
    echo ""
    echo "Stopping terminal server..."
    if pkill -f terminal-server; then
        echo "✅ Terminal server stopped!"
    else
        echo "❌ No terminal server process found to stop."
    fi
    echo ""
    read -p "Press Enter to continue..."
}

check_status() {
    echo ""
    echo "Checking server status..."
    if curl -s http://localhost:3001/api/health | grep -q "Terminal service is running"; then
        echo "✅ Terminal Server Status: RUNNING"
        echo "Server is active on: http://localhost:3001"
        echo "Marcus AI terminal commands are working!"
    else
        echo "❌ Terminal Server Status: NOT RUNNING"
        echo "Server is not responding on: http://localhost:3001"
        echo "Click option 1 to start the server."
    fi
    echo ""
    read -p "Press Enter to continue..."
}

# Main menu loop
while true; do
    show_menu
    read -p "Select an option (1-4): " choice
    
    case $choice in
        1) start_server ;;
        2) stop_server ;;
        3) check_status ;;
        4) echo "Goodbye!"; exit 0 ;;
        *) echo "Invalid option. Please try again."; sleep 1 ;;
    esac
done
