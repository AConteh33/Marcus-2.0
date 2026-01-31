# GitHub Actions Workflows

This directory contains automated deployment workflows for Marcus AI Assistant.

## Workflows Overview

### 1. `release.yml` - Tag-based Releases
**Trigger**: Git tags matching `v*` (e.g., v1.8.0, v1.8.1)

**Features**:
- Cross-platform builds (Windows, macOS, Linux)
- Multiple architectures (x64, ARM64)
- Automatic GitHub releases
- Artifact uploads

**Usage**:
```bash
git tag v1.8.1
git push origin v1.8.1
```

### 2. `auto-update.yml` - Continuous Deployment
**Triggers**:
- Push to `main` or `develop` branches
- Manual workflow dispatch

**Features**:
- Auto-updater support
- Platform-specific builds
- Release notes generation
- Version management

## Platform Support

| Platform | Architectures | Formats |
|----------|----------------|---------|
| Windows | x64, ARM64 | EXE, Portable, ZIP |
| macOS | x64, ARM64 | DMG, ZIP |
| Linux | x64, ARM64 | AppImage, DEB, RPM, Snap |

## Security

- Code signing support for macOS
- GitHub token authentication
- Secure secret management
- Dependency caching

## Monitoring

Check workflow status at:
https://github.com/AConteh33/Marcus-2.0/actions

## Troubleshooting

Common issues and solutions are documented in the main `DEPLOYMENT.md` file.
