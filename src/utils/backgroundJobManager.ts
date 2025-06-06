
interface JobProgress {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  results: any[];
  error?: string;
  startTime: number;
  endTime?: number;
}

export class BackgroundJobManager {
  private static instance: BackgroundJobManager;
  private jobs: Map<string, JobProgress> = new Map();
  private jobHandlers: Map<string, (job: JobProgress, data: any) => Promise<void>> = new Map();

  static getInstance(): BackgroundJobManager {
    if (!this.instance) {
      this.instance = new BackgroundJobManager();
    }
    return this.instance;
  }

  registerJobHandler(type: string, handler: (job: JobProgress, data: any) => Promise<void>) {
    this.jobHandlers.set(type, handler);
  }

  createJob(type: string, data: any): string {
    const jobId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: JobProgress = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      currentStep: 'Initialisierung...',
      totalSteps: 0,
      completedSteps: 0,
      results: [],
      startTime: Date.now()
    };

    this.jobs.set(jobId, job);
    
    // Start processing in background
    this.processJob(jobId, data).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error.message,
        endTime: Date.now()
      });
    });

    return jobId;
  }

  getJob(jobId: string): JobProgress | null {
    return this.jobs.get(jobId) || null;
  }

  updateJob(jobId: string, updates: Partial<JobProgress>) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
      
      // Calculate progress if totalSteps is known
      if (job.totalSteps > 0) {
        job.progress = Math.min(100, (job.completedSteps / job.totalSteps) * 100);
      }
      
      // Save to localStorage for persistence
      localStorage.setItem(`job_${jobId}`, JSON.stringify(job));
    }
  }

  private async processJob(jobId: string, data: any) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const handler = this.jobHandlers.get(job.type);
    if (!handler) {
      throw new Error(`No handler registered for job type: ${job.type}`);
    }

    this.updateJob(jobId, { status: 'running' });
    
    try {
      await handler(job, data);
      this.updateJob(jobId, { 
        status: 'completed', 
        progress: 100,
        endTime: Date.now()
      });
    } catch (error) {
      this.updateJob(jobId, {
        status: 'failed',
        error: error.message,
        endTime: Date.now()
      });
      throw error;
    }
  }

  stopJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'running') {
      this.updateJob(jobId, {
        status: 'failed',
        error: 'Job was manually stopped',
        endTime: Date.now()
      });
    }
  }

  clearCompletedJobs() {
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.jobs.delete(jobId);
        localStorage.removeItem(`job_${jobId}`);
      }
    }
  }
}
