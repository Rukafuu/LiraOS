const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

export interface ImageGenerationJob {
  jobId: string;
  status: 'queued' | 'generating' | 'ready' | 'error';
  progress?: number;
  imageUrl?: string;
  error?: string;
  prompt?: string;
}

class ImageService {
  private activeJobs = new Map<string, ImageGenerationJob>();

  /**
   * Generate an image (returns immediately with jobId)
   */
  async generateImage(prompt: string): Promise<{ jobId: string }> {
    const jobId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store job in memory
    this.activeJobs.set(jobId, {
      jobId,
      status: 'queued',
      progress: 0,
      prompt
    });

    // Start generation in background
    this.startGeneration(jobId, prompt);

    return { jobId };
  }

  /**
   * Get job status
   */
  getJob(jobId: string): ImageGenerationJob | undefined {
    return this.activeJobs.get(jobId);
  }

  /**
   * Poll for job updates
   */
  async pollJob(jobId: string, onUpdate: (job: ImageGenerationJob) => void): Promise<void> {
    const poll = async () => {
      const job = this.getJob(jobId);
      if (!job) return;

      onUpdate(job);

      if (job.status === 'ready' || job.status === 'error') {
        return; // Stop polling
      }

      // Continue polling
      setTimeout(poll, 500);
    };

    await poll();
  }

  /**
   * Internal: Start actual generation
   */
  private async startGeneration(jobId: string, prompt: string): Promise<void> {
    try {
      const job = this.activeJobs.get(jobId);
      if (!job) return;

      // Update to generating
      job.status = 'generating';
      job.progress = 10;
      this.activeJobs.set(jobId, { ...job });

      // Call backend (this is a placeholder - adapt to your actual API)
      const response = await fetch(`${API_BASE_URL}/api/images/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update job with result
      job.status = 'ready';
      job.progress = 100;
      job.imageUrl = result.imageUrl || result.url;
      this.activeJobs.set(jobId, { ...job });

    } catch (error) {
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = 'error';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        this.activeJobs.set(jobId, { ...job });
      }
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job || !job.prompt) return;

    job.status = 'queued';
    job.progress = 0;
    job.error = undefined;
    this.activeJobs.set(jobId, { ...job });

    await this.startGeneration(jobId, job.prompt);
  }

  /**
   * Clear completed jobs
   */
  clearJob(jobId: string): void {
    this.activeJobs.delete(jobId);
  }
}

export const imageService = new ImageService();
