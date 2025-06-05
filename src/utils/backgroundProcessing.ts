export interface BackgroundJob {
  id: string;
  type: 'analysis';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  data: any;
  results?: any;
  error?: string;
}

export class BackgroundJobManager {
  private static instance: BackgroundJobManager;
  private jobs: Map<string, BackgroundJob> = new Map();
  private workers: Worker[] = [];
  private maxWorkers = 3;

  static getInstance(): BackgroundJobManager {
    if (!this.instance) {
      this.instance = new BackgroundJobManager();
    }
    return this.instance;
  }

  createJob(type: 'analysis', data: any): string {
    const jobId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: BackgroundJob = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      data
    };

    this.jobs.set(jobId, job);
    this.saveJobsToStorage();
    
    // Start processing immediately if workers are available
    this.processNextJob();
    
    return jobId;
  }

  async processNextJob(): Promise<void> {
    if (this.workers.length >= this.maxWorkers) {
      return; // All workers busy
    }

    const pendingJob = Array.from(this.jobs.values())
      .find(job => job.status === 'pending');

    if (!pendingJob) {
      return; // No pending jobs
    }

    this.updateJobStatus(pendingJob.id, 'running');
    
    try {
      if (pendingJob.type === 'analysis') {
        await this.processAnalysisJob(pendingJob);
      }
    } catch (error) {
      this.updateJobStatus(pendingJob.id, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async processAnalysisJob(job: BackgroundJob): Promise<void> {
    const { fileContent, archetypes, aiConfig } = job.data;
    const { AnalysisController } = await import('../components/AnalysisEngine');
    const { TextChunker } = await import('./textChunking');
    
    const controller = new AnalysisController();
    
    // Create chunks
    const chunks = TextChunker.createChunks(fileContent, {
      maxWordsPerChunk: 400,
      minWordsPerChunk: 150,
      preserveStructure: true
    });

    const totalSteps = archetypes.length * chunks.length;
    let completedSteps = 0;
    
    const results = [];
    
    // Process in parallel batches
    const batchSize = 5;
    for (let archetypeIndex = 0; archetypeIndex < archetypes.length; archetypeIndex++) {
      const archetype = archetypes[archetypeIndex];
      
      // Process chunks in batches
      for (let i = 0; i < chunks.length; i += batchSize) {
        const chunkBatch = chunks.slice(i, Math.min(i + batchSize, chunks.length));
        
        const batchPromises = chunkBatch.map(async (chunk, batchIndex) => {
          const chunkIndex = i + batchIndex;
          return this.processChunk(archetype, chunk.content, chunkIndex, aiConfig);
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, batchIndex) => {
          completedSteps++;
          const progress = (completedSteps / totalSteps) * 100;
          
          if (result.status === 'fulfilled') {
            results.push(result.value);
          }
          
          this.updateJobProgress(job.id, progress);
        });
        
        // Small delay between batches to prevent rate limiting
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    this.updateJobStatus(job.id, 'completed', results);
  }

  private async processChunk(archetype: any, content: string, chunkIndex: number, aiConfig: any): Promise<any> {
    const prompt = this.createAnalysisPrompt(archetype, content, chunkIndex);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein präziser Literaturkritiker. Antworte ausschließlich in gültigem JSON ohne zusätzlichen Text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error ${response.status}`);
    }

    const data = await response.json();
    const content_response = data.choices[0].message.content;
    
    const jsonMatch = content_response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Keine gültige JSON-Antwort erhalten');
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    return {
      archetypeId: archetype.id,
      chunkIndex,
      ratings: analysisData.ratings,
      overallRating: analysisData.overallRating || 0,
      feedback: analysisData.feedback,
      buyingProbability: analysisData.buyingProbability || 0,
      recommendationLikelihood: analysisData.recommendationLikelihood || 0,
      expectedReviewSentiment: analysisData.expectedReviewSentiment || 'neutral',
      marketingInsights: analysisData.marketingInsights || []
    };
  }

  private createAnalysisPrompt(archetype: any, chunk: string, chunkIndex: number): string {
    return `Du bist ein Literatur-Kritiker und verhältst dich wie folgende Persona:

PERSONA: ${archetype.name}
BESCHREIBUNG: ${archetype.description}
DEMOGRAPHIK: ${archetype.demographics}
LESEGEWOHNHEITEN: ${archetype.readingPreferences}
PERSÖNLICHKEIT: ${archetype.personalityTraits.join(', ')}
MOTIVATIONEN: ${archetype.motivations.join(', ')}
PAIN POINTS: ${archetype.painPoints.join(', ')}

Analysiere diesen Textabschnitt aus deiner Persona-Perspektive:

"${chunk}"

Bewerte auf Skala 1-10 (Dezimalstellen erlaubt):
- Engagement: Wie fesselnd ist der Text?
- Stil: Wie gefällt dir der Schreibstil?
- Klarheit: Wie verständlich ist der Text?
- Tempo: Wie ist das Erzähltempo?
- Relevanz: Wie relevant ist der Inhalt für dich?

Schätze (0-1 als Dezimalzahl):
- Kaufwahrscheinlichkeit: Würdest du das Buch kaufen?
- Weiterempfehlungswahrscheinlichkeit: Würdest du es weiterempfehlen?

Review-Stimmung: positive, neutral oder negative

Gib 2-3 Marketing-Insights aus deiner Persona-Sicht.

Antworte NUR in diesem JSON-Format:
{
  "ratings": {
    "engagement": 0.0,
    "style": 0.0,
    "clarity": 0.0,
    "pacing": 0.0,
    "relevance": 0.0
  },
  "overallRating": 0.0,
  "feedback": "Dein detailliertes Feedback als Persona (max 150 Wörter)",
  "buyingProbability": 0.0,
  "recommendationLikelihood": 0.0,
  "expectedReviewSentiment": "positive/neutral/negative",
  "marketingInsights": ["Insight 1", "Insight 2"]
}`;
  }

  updateJobStatus(jobId: string, status: BackgroundJob['status'], results?: any, error?: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = status;
    if (results) job.results = results;
    if (error) job.error = error;
    if (status === 'completed' || status === 'failed') {
      job.endTime = Date.now();
    }

    this.jobs.set(jobId, job);
    this.saveJobsToStorage();
    
    // Process next job if this one finished
    if (status === 'completed' || status === 'failed') {
      setTimeout(() => this.processNextJob(), 100);
    }
  }

  updateJobProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.progress = Math.min(100, Math.max(0, progress));
    this.jobs.set(jobId, job);
    this.saveJobsToStorage();
  }

  getJob(jobId: string): BackgroundJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): BackgroundJob[] {
    return Array.from(this.jobs.values());
  }

  private saveJobsToStorage(): void {
    try {
      const serializedJobs = JSON.stringify(Array.from(this.jobs.entries()));
      localStorage.setItem('background_jobs', serializedJobs);
    } catch (error) {
      console.warn('Failed to save jobs to localStorage:', error);
    }
  }

  loadJobsFromStorage(): void {
    try {
      const serializedJobs = localStorage.getItem('background_jobs');
      if (serializedJobs) {
        const jobEntries = JSON.parse(serializedJobs);
        this.jobs = new Map(jobEntries);
        
        // Resume any running jobs as pending
        this.jobs.forEach(job => {
          if (job.status === 'running') {
            job.status = 'pending';
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load jobs from localStorage:', error);
    }
  }

  clearCompletedJobs(): void {
    Array.from(this.jobs.values())
      .filter(job => job.status === 'completed' || job.status === 'failed')
      .forEach(job => this.jobs.delete(job.id));
    
    this.saveJobsToStorage();
  }
}
