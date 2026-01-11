import { spawn } from 'child_process';
import path from 'path';

/**
 * Execution Tools for Trae Mode
 * Provides safe command execution with timeouts and validation
 */

const WORKSPACE_ROOT = path.resolve(process.cwd(), '..');
const COMMAND_TIMEOUT = 60000; // 60 seconds
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB

/**
 * Whitelist of allowed commands
 */
const ALLOWED_COMMANDS = [
    'npm',
    'node',
    'git',
    'npx',
    'tsc',
    'eslint',
    'prettier',
    'jest',
    'vitest',
    'vite'
];

/**
 * Check if command is allowed
 */
function isCommandAllowed(command) {
    const baseCommand = command.split(' ')[0];
    return ALLOWED_COMMANDS.includes(baseCommand);
}

/**
 * Execute a shell command
 */
export async function runCommand(command, cwd = WORKSPACE_ROOT, options = {}) {
    return new Promise((resolve) => {
        // Validate command
        if (!isCommandAllowed(command)) {
            return resolve({
                success: false,
                command,
                error: 'Command not allowed. Only whitelisted commands can be executed.',
                allowedCommands: ALLOWED_COMMANDS
            });
        }

        const timeout = options.timeout || COMMAND_TIMEOUT;
        const workDir = path.resolve(WORKSPACE_ROOT, cwd);
        
        // Parse command
        const parts = command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        let stdout = '';
        let stderr = '';
        let killed = false;

        const proc = spawn(cmd, args, {
            cwd: workDir,
            shell: true,
            env: { ...process.env, ...options.env }
        });

        // Set timeout
        const timer = setTimeout(() => {
            killed = true;
            proc.kill('SIGTERM');
        }, timeout);

        // Collect stdout
        proc.stdout.on('data', (data) => {
            if (stdout.length < MAX_OUTPUT_SIZE) {
                stdout += data.toString();
            }
        });

        // Collect stderr
        proc.stderr.on('data', (data) => {
            if (stderr.length < MAX_OUTPUT_SIZE) {
                stderr += data.toString();
            }
        });

        // Handle completion
        proc.on('close', (code) => {
            clearTimeout(timer);
            
            resolve({
                success: code === 0 && !killed,
                command,
                cwd: path.relative(WORKSPACE_ROOT, workDir),
                exitCode: code,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                killed,
                duration: Date.now() - proc.spawnargs.startTime
            });
        });

        // Handle errors
        proc.on('error', (error) => {
            clearTimeout(timer);
            resolve({
                success: false,
                command,
                error: error.message
            });
        });

        // Store start time
        proc.spawnargs.startTime = Date.now();
    });
}

/**
 * Run npm command
 */
export async function runNpm(args, cwd = WORKSPACE_ROOT) {
    return runCommand(`npm ${args}`, cwd);
}

/**
 * Run tests
 */
export async function runTests(testPath = '', cwd = WORKSPACE_ROOT) {
    const command = testPath 
        ? `npm test -- ${testPath}`
        : 'npm test';
    
    return runCommand(command, cwd, { timeout: 120000 }); // 2 minutes for tests
}

/**
 * Run linter
 */
export async function lintCode(filePath = '', cwd = WORKSPACE_ROOT) {
    const command = filePath
        ? `npx eslint ${filePath}`
        : 'npx eslint .';
    
    return runCommand(command, cwd);
}

/**
 * Run TypeScript compiler
 */
export async function typeCheck(cwd = WORKSPACE_ROOT) {
    return runCommand('npx tsc --noEmit', cwd);
}

/**
 * Build project
 */
export async function buildProject(cwd = WORKSPACE_ROOT) {
    return runCommand('npm run build', cwd, { timeout: 300000 }); // 5 minutes for build
}

/**
 * Install dependencies
 */
export async function installDependencies(cwd = WORKSPACE_ROOT) {
    return runCommand('npm install', cwd, { timeout: 300000 }); // 5 minutes for install
}

/**
 * Run custom npm script
 */
export async function runScript(scriptName, cwd = WORKSPACE_ROOT) {
    return runCommand(`npm run ${scriptName}`, cwd);
}

/**
 * Check if command is available
 */
export async function checkCommand(command) {
    const result = await runCommand(`${command} --version`);
    return {
        available: result.success,
        command,
        version: result.stdout
    };
}
