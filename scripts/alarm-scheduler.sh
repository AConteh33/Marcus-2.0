#!/bin/bash

# Alarm Scheduler Script for Marcus App
# Sets system alarms and schedules Marcus app to launch

ALARM_LOG="$HOME/Desktop/marcus_alarms.log"
MARCUS_APP_PATH=""  # Will be detected automatically

# Detect Marcus app path
detect_marcus_path() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if [ -d "/Applications/Dera-tak Demo Assistant.app" ]; then
            MARCUS_APP_PATH="/Applications/Dera-tak Demo Assistant.app"
        elif [ -d "$HOME/Applications/Dera-tak Demo Assistant.app" ]; then
            MARCUS_APP_PATH="$HOME/Applications/Dera-tak Demo Assistant.app"
        elif [ -f "$HOME/Desktop/Marcus 1.9/dist/main.cjs" ]; then
            MARCUS_APP_PATH="$HOME/Desktop/Marcus 1.9"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if [ -f "/usr/local/bin/marcus" ]; then
            MARCUS_APP_PATH="/usr/local/bin/marcus"
        elif [ -f "$HOME/Desktop/Marcus 1.9/dist/main.cjs" ]; then
            MARCUS_APP_PATH="$HOME/Desktop/Marcus 1.9"
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        if [ -f "/c/Program Files/Dera-tak Demo Assistant/Dera-tak Demo Assistant.exe" ]; then
            MARCUS_APP_PATH="/c/Program Files/Dera-tak Demo Assistant/Dera-tak Demo Assistant.exe"
        elif [ -f "$HOME/Desktop/Marcus 1.9/dist/main.cjs" ]; then
            MARCUS_APP_PATH="$HOME/Desktop/Marcus 1.9"
        fi
    fi
    
    echo "$MARCUS_APP_PATH"
}

# Function to set an alarm
set_alarm() {
    local time="$1"
    local message="$2"
    local auto_start="$3"  # "yes" or "no"
    
    # Convert time to cron format (HH:MM format)
    if [[ "$time" =~ ^([0-9]{1,2}):([0-9]{2})$ ]]; then
        local hour="${BASH_REMATCH[1]}"
        local minute="${BASH_REMATCH[2]}"
        
        # Create unique job identifier
        local job_id="marcus_alarm_$(date +%s)"
        
        # Create the alarm script
        local alarm_script="/tmp/alarm_${job_id}.sh"
        cat > "$alarm_script" << EOF
#!/bin/bash
# Alarm: $message
echo "🔔 ALARM: $message" | tee -a "$ALARM_LOG"

# Show notification
if command -v osascript >/dev/null 2>&1; then
    # macOS
    osascript -e "display notification \"$message\" with title \"Marcus Alarm\" sound name \"Glass\""
elif command -v notify-send >/dev/null 2>&1; then
    # Linux
    notify-send "Marcus Alarm" "$message"
fi

# Play sound
if command -v afplay >/dev/null 2>&1; then
    # macOS
    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true
elif command -v paplay >/dev/null 2>&1; then
    # Linux
    paplay /usr/share/sounds/alsa/Front_Left.wav 2>/dev/null || true
fi

EOF

        # Add Marcus auto-start if requested
        if [ "$auto_start" = "yes" ]; then
            detect_marcus_path
            if [ -n "$MARCUS_APP_PATH" ]; then
                cat >> "$alarm_script" << EOF

# Start Marcus application
echo "🚀 Starting Marcus application..." | tee -a "$ALARM_LOG"
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [[ "$MARCUS_APP_PATH" == *.app ]]; then
        open "$MARCUS_APP_PATH"
    else
        cd "$MARCUS_APP_PATH" && npm run electron &
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [[ "$MARCUS_APP_PATH" == *.exe ]]; then
        "$MARCUS_APP_PATH" &
    else
        cd "$MARCUS_APP_PATH" && npm run electron &
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    if [[ "$MARCUS_APP_PATH" == *.exe ]]; then
        "$MARCUS_APP_PATH" &
    else
        cd "$MARCUS_APP_PATH" && npm run electron &
    fi
fi
EOF
            fi
        fi
        
        chmod +x "$alarm_script"
        
        # Schedule with cron (if available)
        if command -v crontab >/dev/null 2>&1; then
            # Add to crontab
            (crontab -l 2>/dev/null; echo "$minute $hour * * * $alarm_script") | crontab -
            echo "⏰ Alarm set for $time - $message"
            echo "📝 Job ID: $job_id"
            echo "🚀 Auto-start Marcus: $auto_start"
        else
            # Fallback: use sleep in background
            echo "⏰ Alarm set for $time - $message (using background process)"
            echo "📝 Job ID: $job_id"
            echo "🚀 Auto-start Marcus: $auto_start"
            
            # Calculate seconds until alarm time
            local now=$(date +%s)
            local alarm_time=$(date -d "today $time" +%s 2>/dev/null || date -j -f "%H:%M" "$time" +%s 2>/dev/null)
            
            if [ "$alarm_time" -le "$now" ]; then
                # If time has passed today, schedule for tomorrow
                alarm_time=$((alarm_time + 86400))
            fi
            
            local delay=$((alarm_time - now))
            
            # Schedule background alarm
            (sleep "$delay" && "$alarm_script") &
        fi
        
        # Log the alarm
        echo "$(date): Alarm set for $time - $message (Auto-start: $auto_start)" >> "$ALARM_LOG"
        
    else
        echo "❌ Invalid time format. Use HH:MM format (e.g., 14:30)"
    fi
}

# Function to list alarms
list_alarms() {
    echo "⏰ Active Alarms:"
    echo "----------------------------------------"
    
    if command -v crontab >/dev/null 2>&1; then
        crontab -l 2>/dev/null | grep "marcus_alarm_" | while read -r line; do
            echo "$line"
        done
    else
        echo "Cron not available. Check background processes."
    fi
    
    echo ""
    echo "📋 Alarm History:"
    echo "----------------------------------------"
    if [ -f "$ALARM_LOG" ]; then
        tail -10 "$ALARM_LOG"
    else
        echo "No alarm history found."
    fi
}

# Function to cancel alarms
cancel_alarms() {
    echo "🗑️ Canceling all Marcus alarms..."
    
    if command -v crontab >/dev/null 2>&1; then
        # Remove Marcus alarms from crontab
        crontab -l 2>/dev/null | grep -v "marcus_alarm_" | crontab -
        echo "✅ Alarms removed from crontab"
    fi
    
    # Remove alarm scripts
    rm -f /tmp/alarm_marcus_alarm_*.sh 2>/dev/null
    
    echo "✅ All Marcus alarms canceled"
}

# Function to test alarm
test_alarm() {
    echo "🔔 Testing alarm notification..."
    
    # Show notification
    if command -v osascript >/dev/null 2>&1; then
        # macOS
        osascript -e "display notification \"Test alarm from Marcus\" with title \"Marcus Alarm Test\" sound name \"Glass\""
    elif command -v notify-send >/dev/null 2>&1; then
        # Linux
        notify-send "Marcus Alarm Test" "Test alarm from Marcus"
    fi
    
    # Play sound
    if command -v afplay >/dev/null 2>&1; then
        # macOS
        afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true
    elif command -v paplay >/dev/null 2>&1; then
        # Linux
        paplay /usr/share/sounds/alsa/Front_Left.wav 2>/dev/null || true
    fi
    
    echo "✅ Test alarm completed"
}

# Main script logic
case "$1" in
    "set")
        if [ $# -ge 3 ]; then
            auto_start="${4:-no}"
            set_alarm "$2" "$3" "$auto_start"
        else
            echo "Usage: $0 set \"HH:MM\" \"message\" [auto-start]"
            echo "Example: $0 set \"14:30\" \"Team meeting\" yes"
        fi
        ;;
    "list")
        list_alarms
        ;;
    "cancel")
        cancel_alarms
        ;;
    "test")
        test_alarm
        ;;
    *)
        echo "Marcus Alarm Scheduler"
        echo "Usage: $0 {set|list|cancel|test} [args...]"
        echo ""
        echo "Examples:"
        echo "  $0 set \"14:30\" \"Team meeting\" yes"
        echo "  $0 set \"09:00\" \"Daily standup\""
        echo "  $0 list"
        echo "  $0 cancel"
        echo "  $0 test"
        echo ""
        echo "Note: Use 'yes' as third parameter to auto-start Marcus when alarm triggers"
        ;;
esac
