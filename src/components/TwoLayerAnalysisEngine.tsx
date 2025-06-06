
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
      maxWordsPerChunk: 350,
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
      const layerCorrelation = await this.correlateLayersAnalysis(emotionalNotes, analyticalReview, chunk.content, aiConfig);
      
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
        await new Promise(resolve => setTimeout(resolve, 200));
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

DEINE PERSONA:
- ${archetype.description}
- Persönlichkeit: ${archetype.personalityTraits.join(', ')}
- Motivationen: ${archetype.motivations.join(', ')}
- Schmerzpunkte: ${archetype.painPoints.join(', ')}

TEXT (lies aufmerksam und reagiere authentisch):
"${chunk}"

AUFGABE: Dokumentiere 3-5 spontane emotionale Reaktionen während des Lesens. Denke daran, wie DU als diese spezifische Person reagieren würdest.

Für jede Reaktion:
- Welche Emotion löst dieser spezifische Moment aus? (z.B. "Spannung", "Langeweile", "Rührung", "Irritation", "Neugier")
- Wie intensiv ist das Gefühl? (1-10)
- Was denkst du in diesem Moment? (deine unmittelbaren Gedanken)
- Welche konkrete Textstelle löst das aus? (Zitat)
- Verbindung zu deinem Leben: Woran erinnert dich das? Was berührt dich persönlich?

Sei spezifisch und authentisch für deine Persona. Reagiere auf konkrete Details im Text.

JSON-Format:
{
  "notes": [
    {
      "emotion": "Spezifische Emotion",
      "intensity": 7,
      "reflection": "Meine konkreten Gedanken zu diesem Moment im Text",
      "keyMoment": "Spezifisches Zitat oder Detail aus dem Text",
      "personalConnection": "Wie das mit meinem Leben/meinen Erfahrungen zusammenhängt"
    }
  ]
}`;

    const response = await this.callOpenAI(prompt, aiConfig, 1200);
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
      `${note.emotion} (${note.intensity}/10) bei: "${note.keyMoment}" - ${note.reflection}`
    ).join('; ');

    const prompt = `Analysiere diesen Textabschnitt professionell und berücksichtige die emotionalen Reaktionen:

TEXT:
"${chunk}"

EMOTIONALE REAKTIONEN DES LESERS:
${emotionalSummary}

ANALYTISCHE BEWERTUNG (1-10):

LITERARISCHE ELEMENTE:
- Charakterentwicklung: Wie entwickeln sich die Charaktere in diesem Abschnitt?
- Handlungsfortschritt: Wie trägt dieser Abschnitt zur Gesamthandlung bei?
- Stilqualität: Wie ist die sprachliche Qualität und der Schreibstil?
- Themenexploration: Wie werden Themen entwickelt oder vertieft?

TECHNISCHE ASPEKTE:
- Tempo/Rhythmus: Wie ist das Erzähltempo in diesem Abschnitt?
- Dialoge: Qualität und Natürlichkeit der Dialoge (falls vorhanden)
- Beschreibungen: Qualität und Wirksamkeit der Beschreibungen
- Struktur: Wie gut ist der Abschnitt strukturiert?

MARKTFÄHIGKEIT:
- Genre-Konventionen: Entspricht der Text den Erwartungen des Genres?
- Zielgruppenappeal: Wie ansprechend ist der Text für die Zielgruppe?
- Einzigartigkeit: Was macht diesen Abschnitt besonders/einzigartig?
- Kommerzielles Potenzial: Verkaufsfähigkeit basierend auf diesem Abschnitt

Gib eine detaillierte Analyse (2-3 Sätze) und 2-3 konkrete Verbesserungsvorschläge.

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
  "detailedAnalysis": "Professionelle Bewertung des Textabschnitts",
  "improvementSuggestions": ["Konkreter Vorschlag 1", "Konkreter Vorschlag 2"]
}`;

    const response = await this.callOpenAI(prompt, aiConfig, 1500);
    return {
      chunkIndex,
      ...response
    };
  }

  private async correlateLayersAnalysis(
    emotionalNotes: EmotionalNote[],
    analyticalReview: AnalyticalReview,
    chunk: string,
    aiConfig: AIConfig
  ): Promise<any> {
    const avgEmotionalIntensity = emotionalNotes.reduce((sum, note) => sum + note.intensity, 0) / emotionalNotes.length;
    const avgAnalyticalScore = (
      Object.values(analyticalReview.literaryElements).reduce((a, b) => a + b, 0) +
      Object.values(analyticalReview.technicalAspects).reduce((a, b) => a + b, 0)
    ) / 8;

    const prompt = `Vergleiche die emotionale und analytische Bewertung dieses Textabschnitts:

TEXT-ABSCHNITT:
"${chunk.substring(0, 200)}..."

EMOTIONALE REAKTIONEN:
${emotionalNotes.map(note => `${note.emotion} (${note.intensity}/10): ${note.reflection}`).join('; ')}
Durchschnittliche emotionale Intensität: ${avgEmotionalIntensity.toFixed(1)}/10

ANALYTISCHE BEWERTUNG:
Literarische Qualität: ${Object.values(analyticalReview.literaryElements).reduce((a, b) => a + b, 0) / 4}/10
Technische Qualität: ${Object.values(analyticalReview.technicalAspects).reduce((a, b) => a + b, 0) / 4}/10
Durchschnittliche analytische Bewertung: ${avgAnalyticalScore.toFixed(1)}/10

KORRELATIONS-ANALYSE:
1. Identifiziere emotionale Höhepunkte (Intensität >= 7)
2. Identifiziere analytische Stärken (Bewertung >= 7)
3. Finde Diskrepanzen zwischen emotionaler und analytischer Bewertung
4. Erstelle eine Synthese, die beide Ebenen verbindet

JSON-Format:
{
  "emotionalHighs": [7, 8, 9],
  "analyticalStrengths": [8, 7, 9],
  "discrepancies": ["Beschreibung von Unterschieden zwischen emotionaler und analytischer Bewertung"],
  "synthesis": "Verbindende Analyse beider Bewertungsebenen mit konkreten Erkenntnissen für Autoren und Marketing"
}`;

    return await this.callOpenAI(prompt, aiConfig, 1000);
  }

  private async generateBasicAnalysis(
    chunk: string,
    archetype: ReaderArchetype,
    chunkIndex: number,
    aiConfig: AIConfig
  ): Promise<AnalysisResult> {
    const prompt = `Schnelle Bewertung für ${archetype.name}:

"${chunk}"

Bewerte (1-10): Engagement, Stil, Klarheit, Tempo, Relevanz
Schätze (0-1): Kaufwahrscheinlichkeit, Weiterempfehlung
Kurzes Feedback (max 80 Wörter)

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
  "feedback": "Kurzes Feedback",
  "buyingProbability": 0,
  "recommendationLikelihood": 0,
  "expectedReviewSentiment": "positive",
  "marketingInsights": ["Insight"]
}`;

    const response = await this.callOpenAI(prompt, aiConfig, 800);
    return {
      archetypeId: archetype.id,
      chunkIndex,
      ...response
    };
  }

  private async callOpenAI(prompt: string, aiConfig: AIConfig, maxTokens: number = 1000): Promise<any> {
    const apiKey = aiConfig.apiKey || localStorage.getItem('openai_api_key');
    const model = aiConfig.model || localStorage.getItem('openai_model') || 'gpt-3.5-turbo';
    
    if (!apiKey || apiKey === 'dummy-key') {
      throw new Error('OpenAI API-Schlüssel nicht konfiguriert');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Du bist ein Literaturexperte. Antworte nur in gültigem JSON ohne zusätzlichen Text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Keine gültige JSON-Antwort erhalten');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Content:', jsonMatch[0]);
      throw new Error('Ungültige JSON-Antwort');
    }
  }

  stop(): void {
    this.shouldStop = true;
  }

  isAnalysisRunning(): boolean {
    return this.isRunning;
  }
}
