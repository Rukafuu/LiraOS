import fs from 'fs/promises';
import path from 'path';

/**
 * File System Tools for Trae Mode
 * Provides safe file operations with validation
 */

const WORKSPACE_ROOT = path.resolve(process.cwd(), '..');

/**
 * Validate that a path is within the workspace
 */
function validatePath(filePath) {
    const resolved = path.resolve(WORKSPACE_ROOT, filePath);
    if (!resolved.startsWith(WORKSPACE_ROOT)) {
        throw new Error('Path outside workspace not allowed');
    }
    return resolved;
}

/**
 * Read file contents
 */
export async function readFile(filePath) {
    try {
        const fullPath = validatePath(filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const stats = await fs.stat(fullPath);
        
        return {
            success: true,
            path: filePath,
            content,
            size: stats.size,
            modified: stats.mtime
        };
    } catch (error) {
        return {
            success: false,
            path: filePath,
            error: error.message
        };
    }
}

/**
 * Write file contents (creates directories if needed)
 */
export async function writeFile(filePath, content) {
    try {
        const fullPath = validatePath(filePath);
        const dir = path.dirname(fullPath);
        
        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });
        
        // Write file
        await fs.writeFile(fullPath, content, 'utf-8');
        
        return {
            success: true,
            path: filePath,
            size: Buffer.byteLength(content, 'utf-8')
        };
    } catch (error) {
        return {
            success: false,
            path: filePath,
            error: error.message
        };
    }
}

/**
 * Replace text in file (surgical edit)
 */
export async function replaceInFile(filePath, oldText, newText) {
    try {
        const fullPath = validatePath(filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // Check if text exists
        if (!content.includes(oldText)) {
            return {
                success: false,
                path: filePath,
                error: 'Original text not found in file'
            };
        }
        
        const newContent = content.split(oldText).join(newText);
        
        await fs.writeFile(fullPath, newContent, 'utf-8');
        
        return {
            success: true,
            path: filePath,
            changes: content.split(oldText).length - 1
        };
    } catch (error) {
        return {
            success: false,
            path: filePath,
            error: error.message
        };
    }
}

/**
 * List directory contents
 */
export async function listDirectory(dirPath) {
    try {
        const fullPath = validatePath(dirPath);
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        
        const items = await Promise.all(
            entries.map(async (entry) => {
                const itemPath = path.join(fullPath, entry.name);
                const stats = await fs.stat(itemPath);
                
                return {
                    name: entry.name,
                    path: path.relative(WORKSPACE_ROOT, itemPath),
                    type: entry.isDirectory() ? 'directory' : 'file',
                    size: entry.isFile() ? stats.size : undefined,
                    modified: stats.mtime
                };
            })
        );
        
        return {
            success: true,
            path: dirPath,
            items
        };
    } catch (error) {
        return {
            success: false,
            path: dirPath,
            error: error.message
        };
    }
}

/**
 * Check if file/directory exists
 */
export async function exists(filePath) {
    try {
        const fullPath = validatePath(filePath);
        await fs.access(fullPath);
        return { success: true, exists: true, path: filePath };
    } catch {
        return { success: true, exists: false, path: filePath };
    }
}

/**
 * Delete file
 */
export async function deleteFile(filePath) {
    try {
        const fullPath = validatePath(filePath);
        await fs.unlink(fullPath);
        return { success: true, path: filePath };
    } catch (error) {
        return {
            success: false,
            path: filePath,
            error: error.message
        };
    }
}

/**
 * Copy file
 */
export async function copyFile(sourcePath, destPath) {
    try {
        const fullSource = validatePath(sourcePath);
        const fullDest = validatePath(destPath);
        
        await fs.copyFile(fullSource, fullDest);
        
        return {
            success: true,
            source: sourcePath,
            destination: destPath
        };
    } catch (error) {
        return {
            success: false,
            source: sourcePath,
            destination: destPath,
            error: error.message
        };
    }
}

/**
 * Move/rename file
 */
export async function moveFile(sourcePath, destPath) {
    try {
        const fullSource = validatePath(sourcePath);
        const fullDest = validatePath(destPath);
        
        await fs.rename(fullSource, fullDest);
        
        return {
            success: true,
            source: sourcePath,
            destination: destPath
        };
    } catch (error) {
        return {
            success: false,
            source: sourcePath,
            destination: destPath,
            error: error.message
        };
    }
}

/**
 * Get file metadata
 */
export async function getFileInfo(filePath) {
    try {
        const fullPath = validatePath(filePath);
        const stats = await fs.stat(fullPath);
        
        return {
            success: true,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile()
        };
    } catch (error) {
        return {
            success: false,
            path: filePath,
            error: error.message
        };
    }
}
