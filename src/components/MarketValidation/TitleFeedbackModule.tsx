
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
      
      // This would need actual AI configuration - for now using dummy config
      const aiConfig = { apiKey: 'dummy', model: 'gpt-3.5-turbo' };
      
      const results: TitleFeedback[] = [];
      
      for (const title of validTitles) {
        const result = await simulateTitleFeedback(title, selectedPersonaObjects, bookContext, aiConfig);
        results.push(result);
      }
      
      setFeedback(results);
      onComplete(results);
    } catch (error) {
      console.error('Title analysis error:', error);
      setError('Fehler bei der Titel-Analyse. Bitte versuchen Sie es erneut.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateTitleFeedback = async (
    title: string, 
    personas: ReaderPersona[], 
    bookContext: any,
    aiConfig: any
  ): Promise<TitleFeedback> => {
    // Simulated feedback generation
    const personaFeedback = personas.map(persona => ({
      personaId: persona.id,
      personaName: persona.name,
      appealScore: Math.floor(Math.random() * 4) + 7, // 7-10 range
      genreClarity: Math.floor(Math.random() * 3) + 7, // 7-9 range
      memorability: Math.floor(Math.random() * 4) + 6, // 6-9 range
      thematicFit: Math.floor(Math.random() * 3) + 7, // 7-9 range
      comments: `Als ${persona.demographics.occupation} in der Altersgruppe ${persona.demographics.ageRange} finde ich den Titel "${title}" ${Math.random() > 0.5 ? 'ansprechend' : 'interessant'}. Er ${Math.random() > 0.5 ? 'weckt meine Neugier' : 'passt zu meinen Lesegewohnheiten'}.`,
      positiveAssociations: ['Einprägsam', 'Passend zum Genre', 'Neugierig machend'].slice(0, Math.floor(Math.random() * 3) + 1),
      concerns: Math.random() > 0.7 ? ['Könnte missverständlich sein'] : []
    }));

    const overallScore = personaFeedback.reduce((sum, pf) => sum + pf.appealScore, 0) / personaFeedback.length;
    
    return {
      title,
      personaFeedback,
      overallScore,
      summary: `Der Titel "${title}" erhielt eine durchschnittliche Bewertung von ${overallScore.toFixed(1)}/10. ${overallScore >= 8 ? 'Sehr positives Feedback von den Zielgruppen.' : overallScore >= 7 ? 'Gutes Feedback mit einigen Verbesserungsmöglichkeiten.' : 'Gemischtes Feedback, Überarbeitung empfohlen.'}`
    };
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
