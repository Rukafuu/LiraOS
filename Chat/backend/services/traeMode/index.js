import * as fileSystem from './tools/fileSystem.js';
import * as execution from './tools/execution.js';
import * as git from './tools/git.js';
import * as analysis from './tools/analysis.js';

/**
 * Trae Mode Tools Index
 * Central export for all Trae Mode tools
 */

export const tools = {
    // File System Tools
    readFile: fileSystem.readFile,
    writeFile: fileSystem.writeFile,
    replaceInFile: fileSystem.replaceInFile,
    listDirectory: fileSystem.listDirectory,
    exists: fileSystem.exists,
    deleteFile: fileSystem.deleteFile,
    copyFile: fileSystem.copyFile,
    moveFile: fileSystem.moveFile,
    getFileInfo: fileSystem.getFileInfo,

    // Execution Tools
    runCommand: execution.runCommand,
    runNpm: execution.runNpm,
    runTests: execution.runTests,
    lintCode: execution.lintCode,
    typeCheck: execution.typeCheck,
    buildProject: execution.buildProject,
    installDependencies: execution.installDependencies,
    runScript: execution.runScript,
    checkCommand: execution.checkCommand,

    // Git Tools
    gitStatus: git.gitStatus,
    gitDiff: git.gitDiff,
    gitAdd: git.gitAdd,
    gitCommit: git.gitCommit,
    gitBranch: git.gitBranch,
    getCurrentBranch: git.getCurrentBranch,
    gitLog: git.gitLog,
    gitStash: git.gitStash,
    gitStashPop: git.gitStashPop,
    gitReset: git.gitReset,
    getRepoInfo: git.getRepoInfo,

    // Analysis Tools
    searchCode: analysis.searchCode,
    findFiles: analysis.findFiles,
    getFileOutline: analysis.getFileOutline,
    analyzeError: analysis.analyzeError,
    getProjectStructure: analysis.getProjectStructure
};

/**
 * Get tool by name
 */
export function getTool(name) {
    return tools[name];
}

/**
 * Get all available tools
 */
export function getAllTools() {
    return Object.keys(tools);
}

/**
 * Get tool categories
 */
export function getToolCategories() {
    return {
        fileSystem: [
            'readFile',
            'writeFile',
            'listDirectory',
            'exists',
            'deleteFile',
            'copyFile',
            'moveFile',
            'getFileInfo'
        ],
        execution: [
            'runCommand',
            'runNpm',
            'runTests',
            'lintCode',
            'typeCheck',
            'buildProject',
            'installDependencies',
            'runScript',
            'checkCommand'
        ],
        git: [
            'gitStatus',
            'gitDiff',
            'gitAdd',
            'gitCommit',
            'gitBranch',
            'getCurrentBranch',
            'gitLog',
            'gitStash',
            'gitStashPop',
            'gitReset',
            'getRepoInfo'
        ],
        analysis: [
            'searchCode',
            'findFiles',
            'getFileOutline',
            'analyzeError',
            'getProjectStructure'
        ]
    };
}

export default tools;
