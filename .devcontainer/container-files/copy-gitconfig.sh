#!/bin/bash

# Copy git configuration files during container build

CONTAINER_FILES_DIR="$1"

# Copy .gitconfig if it exists
if [ -f "$CONTAINER_FILES_DIR/.gitconfig" ]; then
    echo "Copying .gitconfig to /home/vscode/.gitconfig"
    cp "$CONTAINER_FILES_DIR/.gitconfig" /home/vscode/.gitconfig
    chown vscode:vscode /home/vscode/.gitconfig
fi

# Copy any additional gitconfig files
for file in "$CONTAINER_FILES_DIR"/.gitconfig*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "Copying $filename to /home/vscode/$filename"
        cp "$file" "/home/vscode/$filename"
        chown vscode:vscode "/home/vscode/$filename"
    fi
done

echo "Git configuration files copied successfully" 