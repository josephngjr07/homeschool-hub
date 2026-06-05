# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homeschool Hub is an educational platform for homeschooling. The project is in early setup phase.

## Tech Stack

- **Runtime**: Node.js 18+
- **Package Manager**: npm
- **Type System**: JavaScript (CommonJS)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
homeschool-hub/
├── src/              # Source code (to be created)
├── public/           # Static assets (to be created)
├── tests/            # Test files (to be created)
├── package.json      # Project metadata and dependencies
├── .gitignore        # Git ignore rules
└── CLAUDE.md         # This file
```

## Git Workflow

- **Main branch**: Production-ready code
- **Develop branch**: Development branch for features
- All commits must include descriptive messages

## Getting Started

1. Clone repository
2. Run `npm install`
3. Create feature branch from `develop`
4. Make changes and test locally
5. Commit with clear messages
6. Push and create PR to `develop`

## Notes for Claude

- This is a greenfield project — no existing architecture yet
- Update this file as structure evolves
- Key decisions about tech, patterns, and conventions will be documented here as they're made
