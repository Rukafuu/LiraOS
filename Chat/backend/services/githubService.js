const { Octokit } = require('@octokit/rest');

/**
 * GitHub Integration Service for L.A.P
 * Provides access to repository files and operations
 */

class GitHubService {
    constructor() {
        this.octokit = null;
        this.owner = null;
        this.repo = null;
    }

    /**
     * Initialize GitHub client with token
     */
    async initialize(token, owner, repo) {
        this.octokit = new Octokit({ auth: token });
        this.owner = owner;
        this.repo = repo;

        // Test connection
        try {
            await this.octokit.repos.get({ owner, repo });
            console.log(`✅ GitHub connected: ${owner}/${repo}`);
            return { success: true };
        } catch (error) {
            console.error('❌ GitHub connection failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * List files in a directory
     */
    async listFiles(path = '') {
        if (!this.octokit) throw new Error('GitHub not initialized');

        try {
            const { data } = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path
            });

            return {
                success: true,
                files: Array.isArray(data) ? data : [data]
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Read file content
     */
    async readFile(path) {
        if (!this.octokit) throw new Error('GitHub not initialized');

        try {
            const { data } = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path
            });

            if (data.type !== 'file') {
                return { success: false, error: 'Path is not a file' };
            }

            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            return {
                success: true,
                content,
                sha: data.sha,
                size: data.size
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Write/Update file
     */
    async writeFile(path, content, message, sha = null) {
        if (!this.octokit) throw new Error('GitHub not initialized');

        try {
            const params = {
                owner: this.owner,
                repo: this.repo,
                path,
                message,
                content: Buffer.from(content).toString('base64')
            };

            if (sha) params.sha = sha;

            const { data } = await this.octokit.repos.createOrUpdateFileContents(params);
            return {
                success: true,
                commit: data.commit.sha
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete file
     */
    async deleteFile(path, message, sha) {
        if (!this.octokit) throw new Error('GitHub not initialized');

        try {
            await this.octokit.repos.deleteFile({
                owner: this.owner,
                repo: this.repo,
                path,
                message,
                sha
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get repository tree (all files)
     */
    async getTree(branch = 'main') {
        if (!this.octokit) throw new Error('GitHub not initialized');

        try {
            const { data } = await this.octokit.git.getTree({
                owner: this.owner,
                repo: this.repo,
                tree_sha: branch,
                recursive: true
            });

            return {
                success: true,
                tree: data.tree
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Search code in repository
     */
    async searchCode(query) {
        if (!this.octokit) throw new Error('GitHub not initialized');

        try {
            const { data } = await this.octokit.search.code({
                q: `${query} repo:${this.owner}/${this.repo}`
            });

            return {
                success: true,
                results: data.items
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get recent commits
     */
    async getCommits(limit = 10) {
        if (!this.octokit) throw new Error('GitHub not initialized');

        try {
            const { data } = await this.octokit.repos.listCommits({
                owner: this.owner,
                repo: this.repo,
                per_page: limit
            });

            return {
                success: true,
                commits: data.map(c => ({
                    sha: c.sha,
                    message: c.commit.message,
                    author: c.commit.author.name,
                    date: c.commit.author.date
                }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new GitHubService();
