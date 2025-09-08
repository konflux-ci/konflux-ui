#!/bin/bash

# GPG configuration setup following VS Code best practices
echo "🔐 Setting up GPG configuration (VS Code best practices)..."

# VS Code automatically copies local .gitconfig into the container
# and forwards GPG keys when properly configured on the host

# Check if GPG keys were forwarded by VS Code
echo "🔍 Checking for GPG keys..."
if gpg --list-secret-keys 2>/dev/null | grep -q "sec"; then
    echo "✅ GPG keys are available"
    
    # List available keys
    echo "📋 Available GPG keys:"
    gpg --list-secret-keys --keyid-format=long
    
    # Check if git signing key is configured
    if git config user.signingkey >/dev/null 2>&1; then
        SIGNING_KEY=$(git config user.signingkey)
        echo "✅ Git signing key configured: $SIGNING_KEY"
        
        # Verify the signing key is available
        if gpg --list-secret-keys "$SIGNING_KEY" >/dev/null 2>&1; then
            echo "✅ Signing key found in GPG keyring"
            echo "✅ Git commit signing is ready"
        else
            echo "⚠️  Signing key '$SIGNING_KEY' not found in GPG keyring"
            echo "💡 Available keys:"
            gpg --list-secret-keys --keyid-format=long | grep -E "(sec|uid)"
        fi
    else
        echo "ℹ️  No Git signing key configured"
        echo "💡 To enable commit signing:"
        echo "   1. List available keys: gpg --list-secret-keys --keyid-format=long"
        echo "   2. Set signing key: git config --global user.signingkey YOUR_KEY_ID"
        echo "   3. Enable signing: git config --global commit.gpgsign true"
    fi
else
    echo "ℹ️  No GPG keys found"
    echo "💡 To use GPG signing in devcontainers:"
    echo "   1. Ensure GPG is set up on your host machine"
    echo "   2. VS Code will automatically forward your GPG keys"
    echo "   3. See: https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials"
fi

echo "🎉 GPG setup complete!" 