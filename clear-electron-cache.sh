#!/bin/bash

echo "Clearing Electron cache for Marcus AI Assistant..."

# Remove Electron's default cache directory
rm -rf ~/Library/Caches/com.dera-tak.demo-assistant

# Remove application data directory
rm -rf ~/Library/Application\ Support/com.dera-tak.demo-assistant

# Remove possible additional cache locations
rm -rf ~/Library/Caches/Dera-tak\ Demo\ Assistant
rm -rf ~/Library/Application\ Support/Dera-tak\ Demo\ Assistant

echo "Electron cache cleared successfully!"
echo "You can now restart the Marcus AI Assistant application."