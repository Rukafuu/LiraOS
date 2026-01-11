import { spawn } from 'child_process';
import path from 'path';
import { readFile } from './fileSystem.js';

/**
 * Git Tools for Trae Mode
 * Provides safe git operations
 */

const WORKSPACE_ROOT = path.resolve(process.cwd(), '..');

/**
 * Execute git command
 */
async function runGit(args, cwd = WORKSPACE_ROOT) {
    return new Promise((resolve) => {
        const proc = spawn('git', args.split(' '), {
            cwd,
            shell: true
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            resolve({
                success: code === 0,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: code
            });
        });

        proc.on('error', (error) => {
            resolve({
                success: false,
                error: error.message
            });
        });
    });
}

/**
 * Get git status
 */
export async function gitStatus() {
    const result = await runGit('status --porcelain');
    
    if (!result.success) {
        return { success: false, error: result.error };
    }

    const lines = result.stdout.split('\n').filter(Boolean);
    const files = lines.map(line => {
        const status = line.substring(0, 2);
        const filePath = line.substring(3);
        
        return {
            path: filePath,
            status: parseGitStatus(status),
            staged: status[0] !== ' ' && status[0] !== '?',
            modified: status[1] !== ' '
        };
    });

    return {
        success: true,
        files,
        hasChanges: files.length > 0
    };
}

/**
 * Parse git status code
 */
function parseGitStatus(code) {
    const statusMap = {
        'M ': 'modified-staged',
        ' M': 'modified',
        'A ': 'added',
        'D ': 'deleted-staged',
        ' D': 'deleted',
        'R ': 'renamed',
        'C ': 'copied',
        '??': 'untracked',
        'MM': 'modified-both'
    };
    
    return statusMap[code] || 'unknown';
}

/**
 * Get git diff
 */
export async function gitDiff(filePath = '', staged = false) {
    const args = staged ? 'diff --cached' : 'diff';
    const command = filePath ? `${args} ${filePath}` : args;
    
    const result = await runGit(command);
    
    if (!result.success) {
        return { success: false, error: result.error };
    }

    return {
        success: true,
        diff: result.stdout,
        hasChanges: result.stdout.length > 0
    };
}

/**
 * Stage files
 */
export async function gitAdd(files) {
    const fileList = Array.isArray(files) ? files.join(' ') : files;
    const result = await runGit(`add ${fileList}`);
    
    return {
        success: result.success,
        files: Array.isArray(files) ? files : [files],
        error: result.error
    };
}

/**
 * Commit changes
 */
export async function gitCommit(message) {
    // Escape quotes in message
    const escapedMessage = message.replace(/"/g, '\\"');
    const result = await runGit(`commit -m "${escapedMessage}"`);
    
    return {
        success: result.success,
        message,
        output: result.stdout,
        error: result.error
    };
}

/**
 * Create or switch branch
 */
export async function gitBranch(branchName, create = false) {
    const command = create ? `checkout -b ${branchName}` : `checkout ${branchName}`;
    const result = await runGit(command);
    
    return {
        success: result.success,
        branch: branchName,
        created: create,
        error: result.error
    };
}

/**
 * Get current branch
 */
export async function getCurrentBranch() {
    const result = await runGit('branch --show-current');
    
    return {
        success: result.success,
        branch: result.stdout,
        error: result.error
    };
}

/**
 * Get commit history
 */
export async function gitLog(limit = 10) {
    const result = await runGit(`log --oneline -n ${limit}`);
    
    if (!result.success) {
        return { success: false, error: result.error };
    }

    const commits = result.stdout.split('\n').filter(Boolean).map(line => {
        const [hash, ...messageParts] = line.split(' ');
        return {
            hash,
            message: messageParts.join(' ')
        };
    });

    return {
        success: true,
        commits
    };
}

/**
 * Stash changes
 */
export async function gitStash(message = '') {
    const command = message ? `stash push -m "${message}"` : 'stash';
    const result = await runGit(command);
    
    return {
        success: result.success,
        message,
        error: result.error
    };
}

/**
 * Apply stash
 */
export async function gitStashPop() {
    const result = await runGit('stash pop');
    
    return {
        success: result.success,
        error: result.error
    };
}

/**
 * Reset changes
 */
export async function gitReset(filePath = '', hard = false) {
    const command = hard 
        ? 'reset --hard HEAD'
        : filePath 
            ? `checkout -- ${filePath}`
            : 'reset HEAD';
    
    const result = await runGit(command);
    
    return {
        success: result.success,
        filePath,
        hard,
        error: result.error
    };
}

/**
 * Get repository info
 */
export async function getRepoInfo() {
    const [branchResult, remoteResult, statusResult] = await Promise.all([
        getCurrentBranch(),
        runGit('remote get-url origin'),
        gitStatus()
    ]);

    return {
        success: true,
        branch: branchResult.branch,
        remote: remoteResult.stdout,
        hasChanges: statusResult.hasChanges,
        files: statusResult.files
    };
}
