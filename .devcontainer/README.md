# Konflux UI DevContainer

This directory contains the DevContainer configuration for the Konflux UI project, allowing you to develop without installing Node.js, Yarn, and other dependencies locally.

While this documentation highlights the installation process for VS Code and other editors built upon it like Cursor, other editors also [support DevContainers](https://containers.dev/supporting).

## Prerequisites

**Option 1: Podman**

- [Podman](https://podman.io/getting-started/installation)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

**Option 2: Docker**

- [Docker](https://www.docker.com/get-started)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## Getting Started

### For Podman Users (Linux/macOS)

1. **Configure Dev Containers to use Podman**:

   - In the VS Code settings (i.e. `~/Library/Application Support/Code/User/settings.json` for a Mac), add

   ```json
   {
     "dev.containers.dockerPath": "podman",
     "dev.containers.dockerSocketPath": "unix:///tmp/podman.sock",
     "dev.containers.dockerComposePath": "podman-compose"
   }
   ```

   - Restart VS Code if it was already running

2. **Open in DevContainer**:

   - Open this repository in VS Code
   - Press `F1` or `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)
   - Type "Dev Containers: Reopen in Container"
   - Select the command and wait for the container to build

3. **Open outside DevContainer**:
   - Once you are done within your DevContainer, you can switch back to the local view
   - Press `F1` or `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)
   - Type "Dev Containers: Open Folder Locally"
   - Select the command

### For Docker Users

1. **Open in DevContainer**:
   - Open this repository in VS Code
   - Press `F1` or `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)
   - Type "Dev Containers: Reopen in Container"
   - Select the command and wait for the container to build

### Alternative Method (Both Docker and Podman)

- Click the "Reopen in Container" button when VS Code prompts you
- Or click the green button in the bottom-left corner and select "Reopen in Container"

## What's Included

- **Node.js 20**: Latest LTS version as required by the project
- **Yarn 1.22.22**: Package manager as specified in the project requirements
- **VS Code Extensions**: Pre-configured with useful extensions for React/TypeScript development
- **Development Tools**: ESLint, Prettier, Stylelint, and more

## Available Commands

Once the container is running and dependencies are installed, you can run:

```bash
# Start the development server
yarn start

# Run tests
yarn test

# Run tests with coverage
yarn coverage

# Run linting
yarn lint

# Run TypeScript type checks
yarn type-checks

# Build for production
yarn build

# Analyze bundle size
yarn analyze
```

## Port Forwarding

The devcontainer automatically forwards these ports:

- **Port 3000**: Development server (automatically opens when running `yarn start`)
- **Port 9000**: Webpack Bundle Analyzer

## Features

- **Auto-install dependencies**: Dependencies are automatically installed when the container starts
- **Integrated terminal**: Full terminal access within the container
- **Git integration**: Git is pre-configured with forge-specific identity detection
- **GitHub CLI**: GitHub CLI is available for GitHub operations
- **Format on save**: Code is automatically formatted when you save files
- **ESLint integration**: Real-time linting feedback in the editor

## Git Configuration

This devcontainer uses a hybrid approach combining VS Code's [standard Git credential sharing](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials) with enhanced multi-forge identity support:

- **Git config**: Enhanced forge-specific identity detection (see below) + VS Code's standard `.gitconfig` copying
- **SSH keys**: VS Code's standard SSH agent forwarding (automatic if SSH agent is running)
- **GPG keys**: VS Code's standard GPG key mounting (`~/.gnupg` directory mounted into container)

### Forge-Specific Git Identities (Recommended)

To use different Git identities for different forges (GitHub, GitLab, etc.), create forge-specific configuration files on your **host machine**:

**For GitHub repositories** (`~/.gitconfig-github`):

```ini
[user]
    name = Your GitHub Name
    email = your-github-email@example.com
    signingkey = YOUR_GITHUB_GPG_KEY_ID
[commit]
    gpgsign = true
```

**For GitLab repositories** (`~/.gitconfig-gitlab`):

```ini
[user]
    name = Your GitLab Name
    email = your-gitlab-email@example.com
    signingkey = YOUR_GITLAB_GPG_KEY_ID
[commit]
    gpgsign = true
```

**For other forges** (`~/.gitconfig-<hostname>`):

```ini
[user]
    name = Your Name
    email = your-email@example.com
    signingkey = YOUR_GPG_KEY_ID
[commit]
    gpgsign = true
```

### How It Works

1. **Create forge-specific config files** on your host machine (see examples above)
2. **When you open/rebuild the devcontainer**:
   - Your `~/.gitconfig*` files are automatically copied to the build context
   - The container is built with these files included
   - Git is automatically configured based on your repository's remote URL
   - Your GPG keys and SSH keys are available for signing and authentication

**Note**: You need to rebuild the devcontainer (`Dev Containers: Rebuild Container`) after creating or updating forge-specific config files.

### Supported Forges

The setup script automatically detects and configures Git for:

- GitHub (`github.com`)
- GitLab (`gitlab.com`)
- Bitbucket (`bitbucket.org`)
- Any custom Git host (using hostname-based config files)

If no forge-specific configuration is found, the container will use your default Git configuration from `~/.gitconfig`.

### GPG Signing Support

This devcontainer follows VS Code's standard GPG approach:

- Your complete GPG directory (`~/.gnupg`) is mounted into the container
- `gnupg2` is installed in the container for GPG operations
- GPG keys should be accessible inside the container for signing

**Prerequisites on host:**

- Ensure you have GPG set up locally with your signing keys
- Test that `gpg --list-secret-keys` shows your keys

If you encounter GPG signing issues, try rebuilding the container:

```bash
# Rebuild container to refresh GPG setup
# F1 → "Dev Containers: Rebuild Container"
```

For detailed GPG setup instructions, see the [VS Code documentation](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials#_sharing-gpg-keys).

### Alternative: Manual Git Configuration

If you prefer not to create forge-specific config files, you can manually configure Git inside the devcontainer:

```bash
# Set your identity for this repository
git config user.name "Your Name"
git config user.email "your-email@example.com"
git config user.signingkey "YOUR_GPG_KEY_ID"
git config commit.gpgsign true
```

This approach requires manual setup for each repository but gives you full control over the configuration.

## Testing Your Pipeline Changes

After making changes to the pipeline selection feature:

1. **Start the development server**:

   ```bash
   yarn start
   ```

2. **Run the tests**:

   ```bash
   yarn test src/components/ImportForm/PipelineSection
   ```

3. **Check linting**:

   ```bash
   yarn lint
   ```

4. **Navigate to the import form** in the browser to see your pipeline detail changes in action

## Troubleshooting

### General Issues

- **Dependencies not installing**: Try rebuilding the container (`F1` → "Dev Containers: Rebuild Container")
- **Port conflicts**: Check that ports 3000 and 9000 aren't already in use on your host machine

### Docker-Specific Issues

- **Container won't start**: Make sure Docker is running and you have the Dev Containers extension installed

### Podman-Specific Issues

- **Container won't start**:
  - Ensure Podman socket is running: `systemctl --user status podman.socket`
  - Start if needed: `systemctl --user start podman.socket`
  - Check socket permissions: `ls -la $XDG_RUNTIME_DIR/podman/`
- **Permission issues**:
  - Try running: `podman system service --time=0`
  - Check that user namespaces are configured properly
- **VS Code can't connect to Podman**:
  - Re-run the setup script: `./.devcontainer/setup-podman.sh`
  - Restart VS Code completely
  - Check VS Code settings contain the Podman configuration

## Development Workflow

1. Make your code changes
2. The development server will automatically reload
3. Run tests to ensure everything works
4. Use the integrated terminal for any additional commands
5. Commit and push your changes using the integrated Git tools

This devcontainer provides a consistent development environment that matches the project's CI/CD pipeline, ensuring your changes will work correctly when submitted.
