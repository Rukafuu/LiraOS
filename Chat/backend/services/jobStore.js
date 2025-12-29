export const imageJobs = new Map();

// Optional: Auto-cleanup
setInterval(() => {
    const now = Date.now();
    for (const [id, job] of imageJobs.entries()) {
        if (now - job.createdAt > 3600000) { 
            imageJobs.delete(id);
        }
    }
}, 3600000);
