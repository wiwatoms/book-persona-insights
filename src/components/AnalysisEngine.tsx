
import React, { useState, useCallback } from 'react';
import { ReaderArchetype, AnalysisResult } from './BookAnalyzer';
import { AIConfig } from './AIAnalysisService';
import { TextChunker } from '../utils/textChunking';

interface AnalysisEngineProps {
  pdfContent: string;
  archetypes: ReaderArchetype[];
  aiConfig: AIConfig;
  onProgress: (progress: AnalysisProgress) => void;
  onComplete: (results: AnalysisResult[]) => void;
  onError: (error: string) => void;
}

export interface AnalysisProgress {
  currentStep: number;
  totalSteps: number;
  currentArchetype: string;
  currentChunk: number;
  totalChunks: number;
  status: string;
  results: AnalysisResult[];
  apiCalls: number;
  tokenUsage: { prompt: number; completion: number };
  chunkingSummary?: string;
}

export class AnalysisController {
  private isRunning = false;
  private shouldStop = false;
  
  async runAnalysis(
    fileContent: string,
    archetypes: ReaderArchetype[],
    aiConfig: AIConfig,
    onProgress: (progress: AnalysisProgress) => void
  ): Promise<AnalysisResult[]> {
    this.isRunning = true;
    this.shouldStop = false;
    
    const results: AnalysisResult[] = [];
    let apiCalls = 0;
    let tokenUsage = { prompt: 0, completion: 0 };
    
    // Enhanced text chunking
    const chunks = TextChunker.createChunks(fileContent, {
      maxWordsPerChunk: 400,
      minWordsPerChunk: 150,
      preserveStructure: true
    });
    
    const chunkingSummary = TextChunker.getChunkingSummary(chunks);
    console.log('Chunking summary:', chunkingSummary);
    
    const allTasks = archetypes.flatMap(archetype => 
        chunks.map((chunk, chunkIndex) => ({
            archetype,
            chunk,
            chunkIndex
        }))
    );

    const totalSteps = allTasks.length;
    let currentStep = 0;
    
    onProgress({
      currentStep: 0,
      totalSteps,
      currentArchetype: '',
      currentChunk: 0,
      totalChunks: chunks.length,
      status: `Starte Analyse: ${archetypes.length} Archetypen × ${chunks.length} Abschnitte`,
      results: [],
      apiCalls: 0,
      tokenUsage,
      chunkingSummary
    });
    
    const batchSize = 5; // Process 5 API calls in parallel

    for (let i = 0; i < allTasks.length; i += batchSize) {
        if(this.shouldStop) break;

        const batch = allTasks.slice(i, i + batchSize);

        const promises = batch.map(async (task) => {
            try {
                const result = await this.callOpenAI(task.archetype, task.chunk.content, task.chunkIndex, aiConfig);
                return { ...result, archetype: task.archetype, chunk: task.chunk, chunkIndex: task.chunkIndex };
            } catch (error) {
                console.error(`Error analyzing chunk ${task.chunkIndex} for ${task.archetype.name}:`, error);
                return { error, archetype: task.archetype, chunk: task.chunk, chunkIndex: task.chunkIndex }; // Pass error along
            }
        });
        
        const batchResults = await Promise.all(promises);

        for (const result of batchResults) {
            if (this.shouldStop) break;

            currentStep++;
            const chunkDescription = result.chunk.title ? `"${result.chunk.title}" (${result.chunk.wordCount} Wörter)` : `Abschnitt ${result.chunkIndex + 1} (${result.chunk.wordCount} Wörter)`;

            if ('error' in result) {
                 onProgress({
                    currentStep,
                    totalSteps,
                    currentArchetype: result.archetype.name,
                    currentChunk: result.chunkIndex + 1,
                    totalChunks: chunks.length,
                    status: `⚠️ Fehler bei ${chunkDescription}`,
                    results: [...results],
                    apiCalls,
                    tokenUsage,
                    chunkingSummary
                });
            } else {
                results.push(result);
                apiCalls++;
                if (result.tokenUsage) {
                    tokenUsage.prompt += result.tokenUsage.prompt;
                    tokenUsage.completion += result.tokenUsage.completion;
                }
                onProgress({
                    currentStep,
                    totalSteps,
                    currentArchetype: result.archetype.name,
                    currentChunk: result.chunkIndex + 1,
                    totalChunks: chunks.length,
                    status: `✅ ${result.archetype.name}: ${chunkDescription} analysiert (${result.overallRating.toFixed(1)}/10)`,
                    results: [...results],
                    apiCalls,
                    tokenUsage,
                    chunkingSummary
                });
            }
        }

         // Small delay between batches to prevent rate limiting
        if (i + batchSize < allTasks.length && !this.shouldStop) {
          await new Promise(resolve => setTimeout(resolve, 200)); 
        }
    }
    
    this.isRunning = false;
    return results;
  }
  
  stop(): void {
    this.shouldStop = true;
  }
  
  isAnalysisRunning(): boolean {
    return this.isRunning;
  }
  
  private async callOpenAI(
    archetype: ReaderArchetype,
    chunk: string,
    chunkIndex: number,
    aiConfig: AIConfig
  ): Promise<AnalysisResult & { tokenUsage?: { prompt: number; completion: number } }> {
    const prompt = this.createPrompt(archetype, chunk, chunkIndex);
    
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
      const errorData = await response.text();
      throw new Error(`OpenAI API Error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Keine gültige JSON-Antwort erhalten');
    }

    let analysisData;
    try {
      analysisData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      throw new Error('Ungültige JSON-Antwort');
    }

    if (!analysisData.ratings || !analysisData.feedback) {
      throw new Error('Unvollständige Antwort erhalten');
    }

    return {
      archetypeId: archetype.id,
      chunkIndex,
      ratings: analysisData.ratings,
      overallRating: analysisData.overallRating || 0,
      feedback: analysisData.feedback,
      buyingProbability: analysisData.buyingProbability || 0,
      recommendationLikelihood: analysisData.recommendationLikelihood || 0,
      expectedReviewSentiment: analysisData.expectedReviewSentiment || 'neutral',
      marketingInsights: analysisData.marketingInsights || [],
      tokenUsage: data.usage ? {
        prompt: data.usage.prompt_tokens || 0,
        completion: data.usage.completion_tokens || 0
      } : undefined
    };
  }
  
  private createPrompt(archetype: ReaderArchetype, chunk: string, chunkIndex: number): string {
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

Bewerte auf Skala 1-10 (Dezimalstellen erlaubt, z.B. 7.3):
- Engagement: Wie fesselnd ist der Text?
- Stil: Wie gefällt dir der Schreibstil?
- Klarheit: Wie verständlich ist der Text?
- Tempo: Wie ist das Erzähltempo?
- Relevanz: Wie relevant ist der Inhalt für dich?

Schätze (0-1 als Dezimalzahl, z.B. 0.75):
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
}

export const AnalysisEngine: React.FC<AnalysisEngineProps> = ({
  pdfContent,
  archetypes,
  aiConfig,
  onProgress,
  onComplete,
  onError
}) => {
  return null; // This is just a controller component
};
