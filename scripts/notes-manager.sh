#!/bin/bash

# Notes Manager Script for Marcus App
# Creates and manages text file notes on the desktop

NOTES_DIR="$HOME/Desktop/notes"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Create notes directory if it doesn't exist
mkdir -p "$NOTES_DIR"

# Function to create a new note
create_note() {
    local title="$1"
    local content="$2"
    local filename=$(echo "$title" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
    local filepath="$NOTES_DIR/${filename}.txt"
    
    echo "Note created: $TIMESTAMP" > "$filepath"
    echo "Title: $title" >> "$filepath"
    echo "" >> "$filepath"
    echo "$content" >> "$filepath"
    
    echo "✅ Note saved to: $filepath"
}

# Function to read a note
read_note() {
    local title="$1"
    local filename=$(echo "$title" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
    local filepath="$NOTES_DIR/${filename}.txt"
    
    if [ -f "$filepath" ]; then
        echo "📄 Reading note: $title"
        echo "----------------------------------------"
        cat "$filepath"
        echo "----------------------------------------"
    else
        echo "❌ Note not found: $title"
    fi
}

# Function to list all notes
list_notes() {
    echo "📋 Available notes:"
    echo "----------------------------------------"
    if [ "$(ls -A $NOTES_DIR 2>/dev/null)" ]; then
        for file in "$NOTES_DIR"/*.txt; do
            if [ -f "$file" ]; then
                basename "$file" .txt | sed 's/_/ /g'
            fi
        done
    else
        echo "No notes found."
    fi
    echo "----------------------------------------"
}

# Function to delete a note
delete_note() {
    local title="$1"
    local filename=$(echo "$title" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
    local filepath="$NOTES_DIR/${filename}.txt"
    
    if [ -f "$filepath" ]; then
        rm "$filepath"
        echo "🗑️ Note deleted: $title"
    else
        echo "❌ Note not found: $title"
    fi
}

# Function to search notes
search_notes() {
    local keyword="$1"
    echo "🔍 Searching for '$keyword' in notes:"
    echo "----------------------------------------"
    
    if [ "$(ls -A $NOTES_DIR 2>/dev/null)" ]; then
        grep -l -i "$keyword" "$NOTES_DIR"/*.txt 2>/dev/null | while read -r file; do
            echo "Found in: $(basename "$file" .txt | sed 's/_/ /g')"
            grep -i -n "$keyword" "$file" | sed 's/^/  /'
            echo ""
        done
    else
        echo "No notes found to search."
    fi
}

# Main script logic
case "$1" in
    "create")
        if [ $# -eq 3 ]; then
            create_note "$2" "$3"
        else
            echo "Usage: $0 create \"title\" \"content\""
        fi
        ;;
    "read")
        if [ $# -eq 2 ]; then
            read_note "$2"
        else
            echo "Usage: $0 read \"title\""
        fi
        ;;
    "list")
        list_notes
        ;;
    "delete")
        if [ $# -eq 2 ]; then
            delete_note "$2"
        else
            echo "Usage: $0 delete \"title\""
        fi
        ;;
    "search")
        if [ $# -eq 2 ]; then
            search_notes "$2"
        else
            echo "Usage: $0 search \"keyword\""
        fi
        ;;
    *)
        echo "Marcus Notes Manager"
        echo "Usage: $0 {create|read|list|delete|search} [args...]"
        echo ""
        echo "Examples:"
        echo "  $0 create \"Meeting Notes\" \"Discussed project timeline\""
        echo "  $0 read \"Meeting Notes\""
        echo "  $0 list"
        echo "  $0 search \"project\""
        echo "  $0 delete \"Meeting Notes\""
        ;;
esac
