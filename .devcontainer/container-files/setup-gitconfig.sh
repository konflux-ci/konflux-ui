#!/bin/bash

# Check if we're running inside a devcontainer
if [ -z "$REMOTE_CONTAINERS" ] && [ -z "$CODESPACES" ]; then
    echo "⚠️ This script is designed to run inside a devcontainer"
    echo "💡 Make sure you're running this from within the VS Code devcontainer"
    echo ""
fi

GITCONFIG_INPUT_DIR=".devcontainer/.gitconfig-dir"

# Copy any gitconfig files
echo "Copying gitconfig files..." 
for file in "$GITCONFIG_INPUT_DIR/.gitconfig"*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "Copying $filename to /home/vscode/$filename"
        cp "$file" "/home/vscode/$filename"
        chown vscode:vscode "/home/vscode/$filename"
    fi
done

# Setup Git configuration in devcontainer based on remote URL
echo "🔧 Setting up Git configuration for devcontainer..."

# Get the remote URL
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo "⚠️  No Git remote found, skipping Git configuration"
    exit 0
fi

echo "📡 Detected remote: $REMOTE_URL"

# Function to apply git config from a specific config file
apply_git_config() {
    local config_file="$1"
    if [ -f "$config_file" ]; then
        echo "📋 Applying Git configuration from: $config_file"
        
        # Extract user.name, user.email, and user.signingkey from the config file
        local name=$(git config --file="$config_file" --get user.name 2>/dev/null || echo "")
        local email=$(git config --file="$config_file" --get user.email 2>/dev/null || echo "")
        local signingkey=$(git config --file="$config_file" --get user.signingkey 2>/dev/null || echo "")
        local gpgsign=$(git config --file="$config_file" --get commit.gpgsign 2>/dev/null || echo "")
        
        # Apply to local repository
        [ -n "$name" ] && git config user.name "$name" && echo "✅ Set user.name: $name"
        [ -n "$email" ] && git config user.email "$email" && echo "✅ Set user.email: $email"
        [ -n "$signingkey" ] && git config user.signingkey "$signingkey" && echo "✅ Set user.signingkey: $signingkey"
        [ -n "$gpgsign" ] && git config commit.gpgsign "$gpgsign" && echo "✅ Set commit.gpgsign: $gpgsign"
    fi
}

# Check for common forge-specific config files
if [[ $REMOTE_URL == *"github.com"* ]]; then
    echo "🐙 GitHub repository detected"
    apply_git_config "$GITCONFIG_INPUT_DIR/.gitconfig-github"
    apply_git_config "$GITCONFIG_INPUT_DIR/.config/git/github"
elif [[ $REMOTE_URL == *"gitlab.com"* ]]; then
    echo "🦊 GitLab repository detected"  
    apply_git_config "$GITCONFIG_INPUT_DIR/.gitconfig-gitlab"
    apply_git_config "$GITCONFIG_INPUT_DIR/.config/git/gitlab"
elif [[ $REMOTE_URL == *"bitbucket.org"* ]]; then
    echo "🪣 Bitbucket repository detected"
    apply_git_config "$GITCONFIG_INPUT_DIR/.gitconfig-bitbucket"
    apply_git_config "$GITCONFIG_INPUT_DIR/.config/git/bitbucket"
else
    echo "🔍 Checking for forge-specific configurations..."
    
    # Extract hostname from remote URL
    HOSTNAME=$(echo "$REMOTE_URL" | sed -E 's|.*@([^:/]+)[:/].*|\1|' | sed -E 's|https?://([^/]+)/.*|\1|')
    echo "🌐 Extracted hostname: $HOSTNAME"
    
    # Try hostname-specific config
    apply_git_config "$GITCONFIG_INPUT_DIR/.gitconfig-$HOSTNAME"
    apply_git_config "$GITCONFIG_INPUT_DIR/.config/git/$HOSTNAME"
fi

# If no specific config was found, try to read from existing includeIf rules
if [ -z "$(git config --get user.name 2>/dev/null)" ]; then
    echo "⚠️  No specific Git configuration found for this forge"
    echo "💡 Consider creating a forge-specific config file like ~/.gitconfig-github"
    echo "📝 Example:"
    echo "    [user]"
    echo "        name = Your Name"
    echo "        email = your-email@example.com"
    echo "        signingkey = YOUR_GPG_KEY_ID"
    echo "    [commit]"
    echo "        gpgsign = true"
fi

echo "✨ Git configuration setup complete!" 