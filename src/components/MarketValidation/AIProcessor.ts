import { AIConfig } from '../AIAnalysisService';
import { BookContext, MarketPosition, TrendAnalysis, ReaderPersona } from './types';

export class MarketValidationAI {
  private static async callOpenAI(
    prompt: string,
    aiConfig: AIConfig,
    maxTokens: number = 1500
  ): Promise<any> {
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
            content: 'Du bist ein Experte für Buchmarktanalyse und Verlagsstrategien. Antworte ausschließlich in gültigem JSON ohne zusätzlichen Text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
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

  static async analyzeWithContext(
    prompt: string,
    bookContext: BookContext
  ): Promise<string> {
    // This is a simplified version for now - in a real implementation,
    // you would need to get the AI config from somewhere
    const aiConfig: AIConfig = {
      apiKey: 'dummy-key', // This should come from user config
      model: 'gpt-3.5-turbo'
    };

    const contextualPrompt = `
      ${prompt}
      
      Please analyze this in the context of the uploaded book.
    `;

    const result = await this.callOpenAI(contextualPrompt, aiConfig, 2000);
    return JSON.stringify(result);
  }

  static async analyzeLiteraryLandscape(
    bookContext: BookContext,
    userGenres: string[],
    competitorTitles: string[],
    aiConfig: AIConfig
  ): Promise<{ marketPosition: MarketPosition; trendAnalysis: TrendAnalysis }> {
    const bookExcerpt = bookContext.content.substring(0, 3000);
    
    const prompt = `Analysiere das literarische Marktumfeld für dieses Buch basierend auf seinem Inhalt:

BUCHINHALT (Auszug):
"${bookExcerpt}"

BENUTZER-ANGABEN:
- Genres: ${userGenres.join(', ')}
- Vergleichstitel: ${competitorTitles.join(', ')}

Führe eine detaillierte Marktanalyse durch:

1. GENRE-POSITIONIERUNG:
   - Bestätige oder verfeinere die Genres basierend auf dem tatsächlichen Buchinhalt
   - Identifiziere spezifische Sub-Genres, die zum Buch passen
   - Positioniere das Buch auf Skalen (1-10): Ton (düster-hell), Komplexität (einfach-komplex), Tempo (langsam-schnell), emotionale Intensität (niedrig-hoch)

2. WETTBEWERBSANALYSE:
   - Analysiere die Vergleichstitel in Bezug auf das vorliegende Buch
   - Identifiziere Alleinstellungsmerkmale basierend auf dem Buchinhalt
   - Finde potenzielle Marktnischen, die dieses spezifische Buch füllen könnte

3. TREND-ANALYSE:
   - Aktuelle Trends im identifizierten Genre
   - Welche Trends sind für DIESES spezifische Buch relevant?
   - Marktlücken, die das Buch adressieren könnte
   - Chancen basierend auf dem Buchinhalt

Antworte in diesem JSON-Format:
{
  "marketPosition": {
    "genre": "Hauptgenre",
    "subGenres": ["Sub-Genre 1", "Sub-Genre 2"],
    "competitorTitles": ["analysierte Titel"],
    "uniqueSellingPoints": ["USP basierend auf Buchinhalt"],
    "targetNiches": ["spezifische Nischen"],
    "positioningMatrix": {
      "tone": 0,
      "complexity": 0,
      "pacing": 0,
      "emotionalIntensity": 0
    }
  },
  "trendAnalysis": {
    "currentTrends": ["allgemeine Genre-Trends"],
    "relevantToBook": ["für DIESES Buch relevante Trends"],
    "marketGaps": ["Marktlücken"],
    "opportunities": ["spezifische Chancen für dieses Buch"]
  }
}`;

    return await this.callOpenAI(prompt, aiConfig, 2000);
  }

  static async generateTargetPersonas(
    bookContext: BookContext,
    marketPosition: MarketPosition,
    aiConfig: AIConfig
  ): Promise<ReaderPersona[]> {
    const bookExcerpt = bookContext.content.substring(0, 3000);
    
    const prompt = `Generiere detaillierte Leser-Personas für dieses spezifische Buch:

BUCHINHALT (Auszug):
"${bookExcerpt}"

MARKTPOSITIONIERUNG:
- Genre: ${marketPosition.genre}
- Sub-Genres: ${marketPosition.subGenres.join(', ')}
- Alleinstellungsmerkmale: ${marketPosition.uniqueSellingPoints.join(', ')}

Erstelle 4 unterschiedliche, realistische Leser-Personas, die von DIESEM spezifischen Buch angezogen würden. Für jede Persona:

1. Begründe WARUM sie dieses Buch lesen würde basierend auf dessen tatsächlichem Inhalt
2. Identifiziere spezifische Elemente des Buches (Charaktere, Themen, Stil), die sie ansprechen würden
3. Berücksichtige Diversität in Alter, Hintergrund und Lesegewohnheiten
4. Sei spezifisch bei den Verbindungspunkten zum Buch

Antworte in diesem JSON-Format:
{
  "personas": [
    {
      "id": "persona_1",
      "name": "Aussagekräftiger Name",
      "demographics": {
        "ageRange": "25-35",
        "gender": "weiblich/männlich/divers",
        "education": "Bildungsstand",
        "occupation": "Beruf"
      },
      "readingHabits": {
        "frequency": "Lesehäufigkeit",
        "preferredFormats": ["E-Book", "Print"],
        "favoriteGenres": ["bevorzugte Genres"],
        "favoriteAuthors": ["ähnliche Autoren"],
        "discoveryChannels": ["wie sie Bücher entdecken"]
      },
      "psychographics": {
        "values": ["wichtige Werte"],
        "lifestyle": ["Lebensstil-Merkmale"],
        "motivations": ["Lesemotivationen"],
        "painPoints": ["Probleme/Bedürfnisse"]
      },
      "bookConnectionPoints": ["spezifische Elemente aus DIESEM Buch, die ansprechen"]
    }
  ]
}`;

    const response = await this.callOpenAI(prompt, aiConfig, 2500);
    return response.personas;
  }
}

// Export as AIProcessor for backward compatibility
export const AIProcessor = MarketValidationAI;
