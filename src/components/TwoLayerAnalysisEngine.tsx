import React from 'react';
import { ReaderArchetype, AnalysisResult } from './BookAnalyzer';
import { AIConfig } from './AIAnalysisService';
import { TextChunker } from '../utils/textChunking';

export interface EmotionalNote {
  chunkIndex: number;
  timestamp: number;
  emotion: string;
  intensity: number; // 1-10
  reflection: string;
  keyMoment: string;
  personalConnection: string;
}

export interface AnalyticalReview {
  chunkIndex: number;
  literaryElements: {
    characterDevelopment: number;
    plotProgression: number;
    styleQuality: number;
    themeExploration: number;
  };
  technicalAspects: {
    pacing: number;
    dialogue: number;
    description: number;
    structure: number;
  };
  marketViability: {
    genreConventions: number;
    targetAudienceAppeal: number;
    uniqueness: number;
    commercialPotential: number;
  };
  detailedAnalysis: string;
  improvementSuggestions: string[];
}

export interface TwoLayerResult extends AnalysisResult {
  emotionalNotes: EmotionalNote[];
  analyticalReview: AnalyticalReview;
  layerCorrelation: {
    emotionalHighs: number[];
    analyticalStrengths: number[];
    discrepancies: string[];
    synthesis: string;
  };
}

export class TwoLayerAnalysisController {
  private isRunning = false;
  private shouldStop = false;

  async runTwoLayerAnalysis(
    fileContent: string,
    archetype: ReaderArchetype,
    aiConfig: AIConfig,
    onProgress: (progress: { step: string; chunk: number; total: number }) => void
  ): Promise<TwoLayerResult[]> {
    this.isRunning = true;
    this.shouldStop = false;

    const chunks = TextChunker.createChunks(fileContent, {
      maxWordsPerChunk: 300,
      minWordsPerChunk: 100,
      preserveStructure: true
    });

    const results: TwoLayerResult[] = [];

    for (let i = 0; i < chunks.length && !this.shouldStop; i++) {
      const chunk = chunks[i];
      
      onProgress({ step: 'Emotionale Analyse', chunk: i + 1, total: chunks.length });
      
      // Layer 1: Emotional Stream Analysis
      const emotionalNotes = await this.generateEmotionalNotes(chunk.content, archetype, i, aiConfig);
      
      onProgress({ step: 'Analytische Bewertung', chunk: i + 1, total: chunks.length });
      
      // Layer 2: Analytical Review
      const analyticalReview = await this.generateAnalyticalReview(chunk.content, emotionalNotes, i, aiConfig);
      
      onProgress({ step: 'Korrelationsanalyse', chunk: i + 1, total: chunks.length });
      
      // Correlation Analysis
      const layerCorrelation = await this.correlateLayersAnalysis(emotionalNotes, analyticalReview, aiConfig);
      
      // Generate basic analysis result
      const basicResult = await this.generateBasicAnalysis(chunk.content, archetype, i, aiConfig);
      
      results.push({
        ...basicResult,
        emotionalNotes,
        analyticalReview,
        layerCorrelation
      });

      // Small delay to prevent rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    this.isRunning = false;
    return results;
  }

  private async generateEmotionalNotes(
    chunk: string,
    archetype: ReaderArchetype,
    chunkIndex: number,
    aiConfig: AIConfig
  ): Promise<EmotionalNote[]> {
    const prompt = `Du liest als ${archetype.name} diesen Textabschnitt und notierst deine unmittelbaren emotionalen Reaktionen:

TEXT:
"${chunk}"

PERSONA: ${archetype.name}
${archetype.description}

Erstelle 2-4 emotionale Notizen während des Lesens. Für jede Notiz:
- Welche Emotion fühlst du? (z.B. Spannung, Langeweile, Überraschung, Rührung)
- Wie intensiv? (1-10)
- Was denkst du in dem Moment?
- Welche Textstelle löst das aus?
- Persönliche Verbindung oder Erinnerung?

Antworte in JSON:
{
  "notes": [
    {
      "emotion": "Emotionsname",
      "intensity": 7,
      "reflection": "Was ich denke/fühle",
      "keyMoment": "Spezifische Textstelle",
      "personalConnection": "Persönliche Verbindung"
    }
  ]
}`;

    const response = await this.callOpenAI(prompt, aiConfig);
    return response.notes.map((note: any, index: number) => ({
      chunkIndex,
      timestamp: Date.now() + index,
      ...note
    }));
  }

  private async generateAnalyticalReview(
    chunk: string,
    emotionalNotes: EmotionalNote[],
    chunkIndex: number,
    aiConfig: AIConfig
  ): Promise<AnalyticalReview> {
    const emotionalSummary = emotionalNotes.map(note => 
      `${note.emotion} (${note.intensity}/10): ${note.reflection}`
    ).join('; ');

    const prompt = `Analysiere diesen Textabschnitt literaturwissenschaftlich und berücksichtige dabei die emotionalen Reaktionen:

TEXT:
"${chunk}"

EMOTIONALE REAKTIONEN:
${emotionalSummary}

Bewerte objektiv (1-10):

LITERARISCHE ELEMENTE:
- Charakterentwicklung
- Handlungsfortschritt  
- Stilqualität
- Themenexploration

TECHNISCHE ASPEKTE:
- Tempo/Rhythmus
- Dialoge
- Beschreibungen
- Struktur

MARKTFÄHIGKEIT:
- Genre-Konventionen
- Zielgruppenappeal
- Einzigartigkeit
- Kommerzielles Potenzial

Gib detaillierte Analyse und 2-3 Verbesserungsvorschläge.

JSON-Format:
{
  "literaryElements": {
    "characterDevelopment": 0,
    "plotProgression": 0,
    "styleQuality": 0,
    "themeExploration": 0
  },
  "technicalAspects": {
    "pacing": 0,
    "dialogue": 0,
    "description": 0,
    "structure": 0
  },
  "marketViability": {
    "genreConventions": 0,
    "targetAudienceAppeal": 0,
    "uniqueness": 0,
    "commercialPotential": 0
  },
  "detailedAnalysis": "Detaillierte Bewertung",
  "improvementSuggestions": ["Vorschlag 1", "Vorschlag 2"]
}`;

    const response = await this.callOpenAI(prompt, aiConfig);
    return {
      chunkIndex,
      ...response
    };
  }

  private async correlateLayersAnalysis(
    emotionalNotes: EmotionalNote[],
    analyticalReview: AnalyticalReview,
    aiConfig: AIConfig
  ): Promise<any> {
    const prompt = `Korreliere die emotionale und analytische Bewertung:

EMOTIONALE REAKTIONEN:
${emotionalNotes.map(note => `${note.emotion} (${note.intensity}/10)`).join(', ')}

ANALYTISCHE BEWERTUNG:
Literarisch: ${Object.values(analyticalReview.literaryElements).reduce((a, b) => a + b, 0) / 4}/10
Technisch: ${Object.values(analyticalReview.technicalAspects).reduce((a, b) => a + b, 0) / 4}/10

Finde:
- Emotionale Höhepunkte (hohe Intensität)
- Analytische Stärken (hohe Bewertungen)
- Diskrepanzen zwischen Emotion und Analyse
- Synthese beider Ebenen

JSON:
{
  "emotionalHighs": [7, 8, 9],
  "analyticalStrengths": [8, 7, 9],
  "discrepancies": ["Diskrepanz-Beschreibung"],
  "synthesis": "Gesamtsynthese beider Analyseebenen"
}`;

    return await this.callOpenAI(prompt, aiConfig);
  }

  private async generateBasicAnalysis(
    chunk: string,
    archetype: ReaderArchetype,
    chunkIndex: number,
    aiConfig: AIConfig
  ): Promise<AnalysisResult> {
    const prompt = `Grundanalyse für ${archetype.name}:

"${chunk}"

Bewerte 1-10: Engagement, Stil, Klarheit, Tempo, Relevanz
Schätze 0-1: Kaufwahrscheinlichkeit, Weiterempfehlung
Feedback (max 100 Wörter)

JSON:
{
  "ratings": {
    "engagement": 0,
    "style": 0,
    "clarity": 0,
    "pacing": 0,
    "relevance": 0
  },
  "overallRating": 0,
  "feedback": "Feedback",
  "buyingProbability": 0,
  "recommendationLikelihood": 0,
  "expectedReviewSentiment": "positive",
  "marketingInsights": ["Insight"]
}`;

    const response = await this.callOpenAI(prompt, aiConfig);
    return {
      archetypeId: archetype.id,
      chunkIndex,
      ...response
    };
  }

  private async callOpenAI(prompt: string, aiConfig: AIConfig): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: 'Du bist ein Literaturexperte. Antworte nur in gültigem JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Keine gültige JSON-Antwort erhalten');
    }

    return JSON.parse(jsonMatch[0]);
  }

  stop(): void {
    this.shouldStop = true;
  }

  isAnalysisRunning(): boolean {
    return this.isRunning;
  }
}
