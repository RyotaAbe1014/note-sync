# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoteSync is an Electron desktop application for markdown note-taking with Git integration, built with React, TypeScript, and Lexical editor framework. The application supports rich text editing, file management, version control, and AI-powered features.

## Essential Commands

### Development

```bash
npm install          # Install dependencies and set up git hooks
npm start           # Start Electron app in development mode
npm run test:watch  # Run tests in watch mode during development
```

### Code Quality

```bash
npm run format      # Format code with Prettier
npm run lint        # Run ESLint
npm test           # Run all tests once
```

### Build & Distribution

```bash
npm run package    # Create packaged app without installers
npm run make       # Build distributables (DMG, EXE, etc.)
npm run publish    # Publish to S3 (requires AWS credentials in .env)
```

## Architecture Overview

### Process Architecture

- **Main Process** (`src/main/`): Handles system operations, file I/O, Git operations, and native dialogs
- **Renderer Process** (`src/renderer/`): React application with UI components
- **Preload Script** (`src/main/preload.ts`): Secure bridge between main and renderer processes

### IPC Communication Pattern

All renderer-to-main communication goes through the preload script's exposed APIs:

- `window.app` - Application settings
- `window.dialog` - System dialogs
- `window.fs` - File system operations
- `window.export` - Export functionality
- `window.git` - Git operations
- `window.ai` - AI integrations

### State Management

- Uses Jotai for minimal global state (primarily toast notifications)
- Most state is component-local
- Git state managed through `useGitControl` hook
- File state managed through custom hooks (`useFileLoader`, `useFileSave`)

### Editor Architecture

- Lexical framework with extensive plugin system
- Supports markdown, code highlighting, tables, and inline AI
- Two-way markdown conversion
- Auto-save and unsaved changes tracking

### Key Technologies

- **Electron Forge**: Build and packaging
- **Vite**: Fast bundling and HMR
- **Vitest**: Testing framework
- **Tailwind CSS + DaisyUI**: Styling
- **isomorphic-git**: Git operations
- **Lexical**: Rich text editor

## Development Workflow

1. **Feature Development**

   - Create feature branch from main
   - Components go in `src/renderer/components/[FeatureName]/`
   - Add tests alongside components (`*.test.tsx`)
   - Use existing UI patterns from DaisyUI

2. **Testing**

   - Write tests using Vitest and React Testing Library
   - Mock Electron APIs are pre-configured in `src/test/setup.ts`
   - Run `npm run test:watch` during development

3. **Pre-commit**

   - Husky automatically runs Prettier on staged files
   - Ensure tests pass before committing

4. **Building**
   - Use `npm run make` to create platform-specific builds
   - Builds are configured in `forge.config.ts`

## Important Patterns

### Custom Hooks

The codebase extensively uses custom hooks for logic encapsulation:

- File operations: `useFileLoader`, `useFileSave`
- Git operations: `useGitControl`
- UI feedback: `useToast`
- Shortcuts: `useSaveShortcut`

### File System Operations

- All file operations are promise-based
- Large files use chunked reading
- Progress tracking available for file operations

### Git Integration

- Uses status matrix pattern from isomorphic-git
- Token-based authentication for remote operations
- File-level staging/unstaging support

### Security

- Context isolation enabled
- No direct Node.js access in renderer
- IPC channels are strictly defined and typed

## Special Considerations

1. **Japanese Localization**: The app is primarily in Japanese. Test descriptions and UI text should follow this convention.

2. **Development-Only Features**: Stagewise toolbar is loaded only in development mode and excluded from production builds.

3. **Environment Variables**: AWS credentials for S3 publishing should be in `.env` file (not committed to git).

4. **Performance**: Large files are handled with streaming and chunked reading. The editor uses virtual scrolling for long documents.
