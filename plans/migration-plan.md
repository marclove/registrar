# Migration Plan: Bun to Vite and Vitest

This document outlines the plan to migrate the project from Bun to Vite for bundling and Vitest for testing.

## 1. Project Setup and Dependencies

1.  **Create `tmp` directory:** Create a `tmp` directory for temporary test files and add it to `.gitignore`.
2.  **Install new dependencies:** Install `vite`, `vitest`, `vite-plugin-node`, and other required dependencies.
3.  **Update `package.json`:**
    *   Add new scripts for `dev`, `build`, `test`, and `lint` using Vite and Vitest.
    *   Remove old Bun-specific scripts.
    *   Update the `files` array to include the new build output directory (`dist`).
4.  **Create `vite.config.ts`:** Create a Vite configuration file to:
    *   Configure the build process (entry points, output directory, etc.).
    *   Set up Vitest for testing (test environment, setup files, etc.).
    *   Use `vite-plugin-node` to handle Node.js-specific features.

## 2. Application Code Migration

1.  **Update `src/index.ts`:**
    *   Remove the `import.meta.main` block, as Vite handles the entry point differently.
2.  **Update `src/cli.tsx`:**
    *   No major changes are expected, but we will verify that it works with Vite's JSX transform.
3.  **Update `src/app.tsx`:**
    *   No major changes are expected, but we will verify that it works with Vite's JSX transform.
4.  **Update `src/message.ts`:**
    *   Remove the `import.meta.main` block.
5.  **Update `src/providers.ts`:**
    *   Verify that dynamic imports work as expected with Vite.

## 3. Test Migration

1.  **Create test setup file:** Create a `src/test-setup.ts` file to configure Vitest.
2.  **Update `integration.test.ts`:**
    *   Replace `bun:test` with `vitest`.
    *   Update the test to use a temporary git repository in the `tmp` directory.
    *   Use `execa` or a similar library to run the CLI in a subprocess.
3.  **Update `app.test.tsx`:**
    *   Replace `bun:test` with `vitest`.
    *   Update mocks to use Vitest's mocking features (`vi.mock`).
4.  **Update `cli.test.tsx`:**
    *   Replace `bun:test` with `vitest`.
    *   Update mocks to use Vitest's mocking features.
5.  **Update `config.test.ts`:**
    *   Replace `bun:test` with `vitest`.
6.  **Update `index.test.ts`:**
    *   Replace `bun:test` with `vitest`.
7.  **Update `message.test.ts`:**
    *   Replace `bun:test` with `vitest`.
    *   Update mocks to use Vitest's mocking features.
8.  **Update `providers.test.ts`:**
    *   Replace `bun:test` with `vitest`.

## 4. Final Steps

1.  **Run tests:** Run the new test suite with `npm test` to ensure everything is working correctly.
2.  **Run build:** Run the new build script with `npm run build` to generate the production build.
3.  **Linting:** Run `npm run lint` to check for any type errors or linting issues.
4.  **Remove Bun files:** Remove `bun.lockb` and any other Bun-specific files.
5.  **Update `README.md`:** Update the `README.md` file to reflect the new build and test commands.
