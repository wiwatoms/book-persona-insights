import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Play } from 'lucide-react';
import { ReaderPersona } from './types';
import { useBookContext } from './BookContextProvider';
import { MarketValidationAI } from './AIProcessor';

interface TitleFeedbackModuleProps {
  personas: ReaderPersona[];
  onComplete: (feedback: any[]) => void;
}

interface TitleFeedback {
  title: string;
  personaFeedback: {
    personaId: string;
    personaName: string;
    appealScore: number;
    genreClarity: number;
    memorability: number;
    thematicFit: number;
    comments: string;
    positiveAssociations: string[];
    concerns: string[];
  }[];
  overallScore: number;
  summary: string;
}

export const TitleFeedbackModule: React.FC<TitleFeedbackModuleProps> = ({
  personas,
  onComplete
}) => {
  const bookContext = useBookContext();
  const [titles, setTitles] = useState<string[]>(['']);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<TitleFeedback[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addTitle = () => {
    setTitles([...titles, '']);
  };

  const updateTitle = (index: number, value: string) => {
    const newTitles = [...titles];
    newTitles[index] = value;
    setTitles(newTitles);
  };

  const removeTitle = (index: number) => {
    if (titles.length > 1) {
      setTitles(titles.filter((_, i) => i !== index));
    }
  };

  const togglePersona = (personaId: string) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId) 
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const analyzeTitles = async () => {
    const validTitles = titles.filter(t => t.trim());
    
    if (validTitles.length === 0) {
      setError('Bitte geben Sie mindestens einen Titel an.');
      return;
    }

    if (selectedPersonas.length === 0) {
      setError('Bitte wählen Sie mindestens eine Persona aus.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const selectedPersonaObjects = personas.filter(p => selectedPersonas.includes(p.id));
      const aiConfig = { 
        apiKey: localStorage.getItem('openai_api_key') || '', 
        model: localStorage.getItem('openai_model') || 'gpt-4o-mini' 
      };
      
      const results: TitleFeedback[] = [];
      
      for (const title of validTitles) {
        const result = await analyzeTitleWithAI(title, selectedPersonaObjects, bookContext, aiConfig);
        results.push(result);
      }
      
      setFeedback(results);
      onComplete(results);
    } catch (error) {
      console.error('Title analysis error:', error);
      setError(`Fehler bei der Titel-Analyse: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeTitleWithAI = async (
    title: string, 
    personas: ReaderPersona[], 
    bookContext: any,
    aiConfig: any
  ): Promise<TitleFeedback> => {
    const prompt = `Analysiere den Buchtitel "${title}" für verschiedene Leser-Personas basierend auf dem Buchinhalt:

BUCHINHALT (Auszug): "${bookContext.content.substring(0, 2000)}..."

PERSONAS:
${personas.map(p => `
- ${p.name}: ${p.demographics.ageRange}, ${p.demographics.occupation}
  Lesegewohnheiten: ${p.readingHabits.favoriteGenres.join(', ')}
  Motivationen: ${p.psychographics.motivations.join(', ')}
`).join('\n')}

Bewerte für jede Persona den Titel auf einer Skala von 1-10:
- Anziehungskraft (appealScore)
- Genre-Klarheit (genreClarity)  
- Einprägsamkeit (memorability)
- Thematische Passung (thematicFit)

Gib auch Kommentare, positive Assoziationen und mögliche Bedenken an.

Antworte in diesem JSON-Format:
{
  "title": "${title}",
  "personaFeedback": [
    {
      "personaId": "persona_id",
      "personaName": "Name",
      "appealScore": 8,
      "genreClarity": 7,
      "memorability": 9,
      "thematicFit": 8,
      "comments": "Detailliertes Feedback...",
      "positiveAssociations": ["Aspekt 1", "Aspekt 2"],
      "concerns": ["Mögliche Bedenken"]
    }
  ],
  "overallScore": 8.0,
  "summary": "Zusammenfassung der Bewertung"
}`;

    const response = await MarketValidationAI.processPrompt(prompt, aiConfig);
    return JSON.parse(response);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Titel-Feedback Simulator</CardTitle>
          <p className="text-sm text-gray-600">
            Simuliere Feedback von Ihren Zielgruppen zu verschiedenen Titeloptionen
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title Input */}
          <div>
            <Label className="text-base font-medium">Titel-Optionen</Label>
            <div className="space-y-2 mt-2">
              {titles.map((title, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={title}
                    onChange={(e) => updateTitle(index, e.target.value)}
                    placeholder={`Titel ${index + 1}`}
                    className="flex-1"
                  />
                  {titles.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTitle(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addTitle} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Titel hinzufügen
              </Button>
            </div>
          </div>

          {/* Persona Selection */}
          <div>
            <Label className="text-base font-medium">Personas für Feedback auswählen</Label>
            {personas.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Bitte generieren Sie zuerst Zielgruppen-Personas im vorherigen Schritt.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {personas.map((persona) => (
                  <Badge
                    key={persona.id}
                    variant={selectedPersonas.includes(persona.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePersona(persona.id)}
                  >
                    {persona.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={analyzeTitles}
            disabled={isAnalyzing || personas.length === 0}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analysiere Titel...' : 'Titel-Feedback simulieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {feedback.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Titel-Feedback Ergebnisse</h3>
          {feedback.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">"{result.title}"</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Gesamtbewertung:</span>
                  <Badge variant={result.overallScore >= 8 ? "default" : result.overallScore >= 7 ? "secondary" : "outline"}>
                    {result.overallScore.toFixed(1)}/10
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{result.summary}</p>
                
                <div className="space-y-3">
                  {result.personaFeedback.map((pf) => (
                    <div key={pf.personaId} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{pf.personaName}</h4>
                        <Badge variant="outline">{pf.appealScore}/10</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{pf.comments}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium">Positiv:</span>
                          <ul className="list-disc list-inside">
                            {pf.positiveAssociations.map((pos, i) => (
                              <li key={i}>{pos}</li>
                            ))}
                          </ul>
                        </div>
                        {pf.concerns.length > 0 && (
                          <div>
                            <span className="font-medium">Bedenken:</span>
                            <ul className="list-disc list-inside">
                              {pf.concerns.map((concern, i) => (
                                <li key={i}>{concern}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
