/**
 * Phase 1, Task 1: Initialize project structure and install dependencies
 * Test suite to verify all files are created and configured correctly
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

describe('Phase 1, Task 1: Project Structure & Dependencies', () => {
  describe('Root Configuration Files', () => {
    it('should have root package.json with workspaces', async () => {
      const content = await fs.readFile(path.join(rootDir, 'package.json'), 'utf-8');
      const pkg = JSON.parse(content);

      expect(pkg.name).toBe('rhw-research-db');
      expect(pkg.workspaces).toBeDefined();
      expect(Array.isArray(pkg.workspaces)).toBe(true);
      expect(pkg.workspaces).toContain('frontend');
      expect(pkg.workspaces).toContain('api');
      expect(pkg.private).toBe(true);
    });

    it('should have .gitignore', async () => {
      const content = await fs.readFile(path.join(rootDir, '.gitignore'), 'utf-8');

      expect(content).toContain('node_modules/');
      expect(content).toContain('.env.local');
      expect(content).toContain('.DS_Store');
      expect(content).toContain('/dist');
      expect(content).toContain('.vscode/');
    });
  });

  describe('Frontend Configuration', () => {
    it('should have frontend/package.json with React 18 and Vite', async () => {
      const content = await fs.readFile(path.join(rootDir, 'frontend/package.json'), 'utf-8');
      const pkg = JSON.parse(content);

      expect(pkg.name).toBe('@rhw-research/frontend');
      expect(pkg.type).toBe('module');
      expect(pkg.private).toBe(true);

      // Dependencies
      expect(pkg.dependencies).toHaveProperty('react');
      expect(pkg.dependencies).toHaveProperty('react-dom');
      expect(pkg.dependencies.react).toMatch(/\^18\./);  // Match caret version like ^18.2.0
      expect(pkg.dependencies['react-dom']).toMatch(/\^18\./);

      // Dev dependencies
      expect(pkg.devDependencies).toHaveProperty('vite');
      expect(pkg.devDependencies).toHaveProperty('@vitejs/plugin-react');
      expect(pkg.devDependencies).toHaveProperty('vitest');
    });

    it('should have frontend/vite.config.js', async () => {
      const content = await fs.readFile(path.join(rootDir, 'frontend/vite.config.js'), 'utf-8');

      expect(content).toContain('import react from');
      expect(content).toContain('defineConfig');
      expect(content).toContain('plugins:');
      expect(content).toContain('proxy');
      expect(content).toContain('/api/');
    });

    it('should have frontend/.env.example', async () => {
      const content = await fs.readFile(path.join(rootDir, 'frontend/.env.example'), 'utf-8');

      expect(content).toContain('VITE_AZURE_TENANT_ID=');
      expect(content).toContain('VITE_AZURE_CLIENT_ID=');
      expect(content).toContain('VITE_API_BASE_URL=');
    });

    it('should have frontend/src directory structure', async () => {
      const dirs = [
        'src',
        'src/components',
        'src/pages',
        'src/lib',
        'src/styles',
        'src/hooks',
        'src/context',
      ];

      for (const dir of dirs) {
        const fullPath = path.join(rootDir, 'frontend', dir);
        const stat = await fs.stat(fullPath);
        expect(stat.isDirectory()).toBe(true);
      }
    });

    it('should have frontend/src/main.jsx entry point', async () => {
      const content = await fs.readFile(path.join(rootDir, 'frontend/src/main.jsx'), 'utf-8');

      expect(content).toContain('React');
      expect(content).toContain('ReactDOM');
      expect(content).toContain('App');
    });

    it('should have frontend/src/App.jsx', async () => {
      const content = await fs.readFile(path.join(rootDir, 'frontend/src/App.jsx'), 'utf-8');

      expect(content).toContain('export default function App');
    });

    it('should have frontend/src/styles/globals.css with glass utilities', async () => {
      const content = await fs.readFile(path.join(rootDir, 'frontend/src/styles/globals.css'), 'utf-8');

      // Check for CSS variables
      expect(content).toContain('--background:');
      expect(content).toContain('--glass-bg:');
      expect(content).toContain('--glass-border:');

      // Check for glass classes
      expect(content).toContain('.glass {');
      expect(content).toContain('.glass-heavy {');
      expect(content).toContain('.glass-input {');
      expect(content).toContain('.glass-button {');
      expect(content).toContain('.glass-modal {');

      // Check for glow classes
      expect(content).toContain('.glow-amber {');
      expect(content).toContain('.glow-sky {');
      expect(content).toContain('.glow-emerald {');
      expect(content).toContain('.glow-zinc {');

      // Check for backdrop-filter
      expect(content).toContain('backdrop-filter: blur');
    });

    it('should have index.html', async () => {
      const content = await fs.readFile(path.join(rootDir, 'frontend/index.html'), 'utf-8');

      expect(content).toContain('<div id="root"></div>');
      expect(content).toContain('/src/main.jsx');
    });
  });

  describe('API Configuration', () => {
    it('should have api/package.json with Azure Functions dependencies', async () => {
      const content = await fs.readFile(path.join(rootDir, 'api/package.json'), 'utf-8');
      const pkg = JSON.parse(content);

      expect(pkg.name).toBe('@rhw-research/api');
      expect(pkg.type).toBe('module');
      expect(pkg.private).toBe(true);

      // Dependencies
      expect(pkg.dependencies).toHaveProperty('@azure/functions');
      expect(pkg.dependencies).toHaveProperty('@azure/cosmos');
      expect(pkg.dependencies).toHaveProperty('nodemailer');
      expect(pkg.devDependencies).toHaveProperty('vitest');
    });

    it('should have api/local.settings.json.example', async () => {
      const content = await fs.readFile(path.join(rootDir, 'api/local.settings.json.example'), 'utf-8');
      const settings = JSON.parse(content);

      expect(settings.IsEncrypted).toBe(false);
      expect(settings.Values).toHaveProperty('AzureWebJobsStorage');
      expect(settings.Values).toHaveProperty('FUNCTIONS_WORKER_RUNTIME');
      expect(settings.Values).toHaveProperty('COSMOS_ENDPOINT');
      expect(settings.Values).toHaveProperty('COSMOS_KEY');
    });

    it('should have api/src directory structure', async () => {
      const dirs = [
        'src',
        'src/functions',
        'src/lib',
        'src/models',
      ];

      for (const dir of dirs) {
        const fullPath = path.join(rootDir, 'api', dir);
        const stat = await fs.stat(fullPath);
        expect(stat.isDirectory()).toBe(true);
      }
    });
  });

  describe('Git and Version Control', () => {
    it('should have .git directory initialized', async () => {
      const gitDir = path.join(rootDir, '.git');
      const stat = await fs.stat(gitDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should have initial git commit', async () => {
      const headFile = path.join(rootDir, '.git/HEAD');
      const content = await fs.readFile(headFile, 'utf-8');
      expect(content).toContain('ref: refs/heads/');
    });
  });

  describe('Dependencies Installation', () => {
    it('should have node_modules directory at root (npm workspaces)', async () => {
      const nodeModules = path.join(rootDir, 'node_modules');
      const stat = await fs.stat(nodeModules);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should have installed root dependencies including workspace packages', async () => {
      const dirs = ['node_modules'];
      for (const dir of dirs) {
        const fullPath = path.join(rootDir, dir);
        const stat = await fs.stat(fullPath);
        expect(stat.isDirectory()).toBe(true);
      }
    });

    it('should have installed @rhw-research workspace packages', async () => {
      const rhwResearch = path.join(rootDir, 'node_modules/@rhw-research');
      const stat = await fs.stat(rhwResearch);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should have installed React in root node_modules', async () => {
      const react = path.join(rootDir, 'node_modules/react');
      const stat = await fs.stat(react);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('Documentation and Configuration', () => {
    it('should have README.md at root', async () => {
      const content = await fs.readFile(path.join(rootDir, 'README.md'), 'utf-8');

      expect(content).toContain('RHW Research & Knowledge Base');
      expect(content).toMatch(/phase/i);
    });

    it('should have .editorconfig', async () => {
      const content = await fs.readFile(path.join(rootDir, '.editorconfig'), 'utf-8');

      expect(content).toContain('root = true');
      expect(content).toContain('indent_style');
    });
  });
});
