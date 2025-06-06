import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Play } from 'lucide-react';
import { ReaderPersona } from './types';
import { useBookContext } from './BookContextProvider';
import { MarketValidationAI } from './AIProcessor';

interface BlurbFeedbackModuleProps {
  personas: ReaderPersona[];
  onComplete: (feedback: any[]) => void;
}

interface BlurbFeedback {
  blurbId: string;
  blurbText: string;
  personaFeedback: {
    personaId: string;
    personaName: string;
    clarityScore: number;
    intrigueScore: number;
    characterAppeal: number;
    paceConveyed: number;
    buyingIntent: number;
    comments: string;
    strengths: string[];
    weaknesses: string[];
  }[];
  overallScore: number;
  summary: string;
}

export const BlurbFeedbackModule: React.FC<BlurbFeedbackModuleProps> = ({
  personas,
  onComplete
}) => {
  const bookContext = useBookContext();
  const [blurbs, setBlurbs] = useState<string[]>(['']);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<BlurbFeedback[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addBlurb = () => {
    setBlurbs([...blurbs, '']);
  };

  const updateBlurb = (index: number, value: string) => {
    const newBlurbs = [...blurbs];
    newBlurbs[index] = value;
    setBlurbs(newBlurbs);
  };

  const removeBlurb = (index: number) => {
    if (blurbs.length > 1) {
      setBlurbs(blurbs.filter((_, i) => i !== index));
    }
  };

  const togglePersona = (personaId: string) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId) 
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const analyzeBlurbs = async () => {
    const validBlurbs = blurbs.filter(b => b.trim().length > 20);
    
    if (validBlurbs.length === 0) {
      setError('Bitte geben Sie mindestens einen Klappentext mit mindestens 20 Zeichen an.');
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
      
      const results: BlurbFeedback[] = [];
      
      for (let i = 0; i < validBlurbs.length; i++) {
        const result = await analyzeBlurbWithAI(validBlurbs[i], (i + 1).toString(), selectedPersonaObjects, bookContext, aiConfig);
        results.push(result);
      }
      
      setFeedback(results);
      onComplete(results);
    } catch (error) {
      console.error('Blurb analysis error:', error);
      setError(`Fehler bei der Klappentext-Analyse: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeBlurbWithAI = async (
    blurbText: string, 
    blurbId: string,
    personas: ReaderPersona[], 
    bookContext: any,
    aiConfig: any
  ): Promise<BlurbFeedback> => {
    const prompt = `Analysiere den Klappentext für verschiedene Leser-Personas basierend auf dem Buchinhalt:

BUCHINHALT (Auszug): "${bookContext.content.substring(0, 2000)}..."

KLAPPENTEXT: "${blurbText}"

PERSONAS:
${personas.map(p => `
- ${p.name}: ${p.demographics.ageRange}, ${p.demographics.occupation}
  Lesegewohnheiten: ${p.readingHabits.favoriteGenres.join(', ')}
  Motivationen: ${p.psychographics.motivations.join(', ')}
`).join('\n')}

Bewerte für jede Persona den Klappentext auf einer Skala von 1-10:
- Klarheit (clarityScore)
- Spannung/Neugier (intrigueScore)
- Charakter-Anziehung (characterAppeal)
- Tempo-Vermittlung (paceConveyed)
- Kaufabsicht (buyingIntent)

Gib auch Stärken, Schwächen und detaillierte Kommentare an.

Antworte in diesem JSON-Format:
{
  "blurbId": "${blurbId}",
  "blurbText": "${blurbText}",
  "personaFeedback": [
    {
      "personaId": "persona_id",
      "personaName": "Name",
      "clarityScore": 8,
      "intrigueScore": 7,
      "characterAppeal": 9,
      "paceConveyed": 8,
      "buyingIntent": 8,
      "comments": "Detailliertes Feedback...",
      "strengths": ["Stärke 1", "Stärke 2"],
      "weaknesses": ["Schwäche 1"]
    }
  ],
  "overallScore": 8.0,
  "summary": "Zusammenfassung der Klappentext-Bewertung"
}`;

    const response = await MarketValidationAI.processPrompt(prompt, aiConfig);
    return JSON.parse(response);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Klappentext-Feedback Simulator</CardTitle>
          <p className="text-sm text-gray-600">
            Simuliere Feedback von Ihren Zielgruppen zu verschiedenen Klappentext-Varianten
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Blurb Input */}
          <div>
            <Label className="text-base font-medium">Klappentext-Varianten</Label>
            <div className="space-y-4 mt-2">
              {blurbs.map((blurb, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Version {index + 1}</Label>
                    {blurbs.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeBlurb(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={blurb}
                    onChange={(e) => updateBlurb(index, e.target.value)}
                    placeholder="Geben Sie hier Ihren Klappentext ein..."
                    className="min-h-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {blurb.length} Zeichen
                  </p>
                </div>
              ))}
              <Button variant="outline" onClick={addBlurb} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Klappentext-Variante hinzufügen
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
            onClick={analyzeBlurbs}
            disabled={isAnalyzing || personas.length === 0}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analysiere Klappentexte...' : 'Klappentext-Feedback simulieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {feedback.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Klappentext-Feedback Ergebnisse</h3>
          {feedback.map((result, index) => (
            <Card key={result.blurbId}>
              <CardHeader>
                <CardTitle className="text-base">Klappentext Version {index + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Gesamtbewertung:</span>
                  <Badge variant={result.overallScore >= 8 ? "default" : result.overallScore >= 7 ? "secondary" : "outline"}>
                    {result.overallScore.toFixed(1)}/10
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded mb-4 max-h-32 overflow-y-auto">
                  <p className="text-sm">{result.blurbText}</p>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{result.summary}</p>
                
                <div className="space-y-3">
                  {result.personaFeedback.map((pf) => (
                    <div key={pf.personaId} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{pf.personaName}</h4>
                        <Badge variant="outline">
                          {((pf.clarityScore + pf.intrigueScore + pf.characterAppeal + pf.paceConveyed + pf.buyingIntent) / 5).toFixed(1)}/10
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{pf.comments}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p><strong>Klarheit:</strong> {pf.clarityScore}/10</p>
                          <p><strong>Spannung:</strong> {pf.intrigueScore}/10</p>
                          <p><strong>Charaktere:</strong> {pf.characterAppeal}/10</p>
                        </div>
                        <div>
                          <p><strong>Tempo:</strong> {pf.paceConveyed}/10</p>
                          <p><strong>Kaufabsicht:</strong> {pf.buyingIntent}/10</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                        <div>
                          <p className="font-medium text-green-700">Stärken:</p>
                          <ul className="list-disc list-inside">
                            {pf.strengths.map((strength, i) => (
                              <li key={i}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        {pf.weaknesses.length > 0 && (
                          <div>
                            <p className="font-medium text-orange-700">Schwächen:</p>
                            <ul className="list-disc list-inside">
                              {pf.weaknesses.map((weakness, i) => (
                                <li key={i}>{weakness}</li>
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
