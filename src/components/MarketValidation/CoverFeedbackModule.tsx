
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Play, Upload } from 'lucide-react';
import { ReaderPersona } from './types';
import { useBookContext } from './BookContextProvider';

interface CoverFeedbackModuleProps {
  personas: ReaderPersona[];
  onComplete: (feedback: any[]) => void;
}

interface CoverConcept {
  id: string;
  description: string;
  imageUrl?: string;
}

interface CoverFeedback {
  conceptId: string;
  conceptDescription: string;
  personaFeedback: {
    personaId: string;
    personaName: string;
    visualAppeal: number;
    genreAppropriate: number;
    thematicAccuracy: number;
    standoutFactor: number;
    emotionalResponse: string;
    comments: string;
  }[];
  overallScore: number;
  summary: string;
}

export const CoverFeedbackModule: React.FC<CoverFeedbackModuleProps> = ({
  personas,
  onComplete
}) => {
  const bookContext = useBookContext();
  const [concepts, setConcepts] = useState<CoverConcept[]>([
    { id: '1', description: '' }
  ]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<CoverFeedback[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addConcept = () => {
    const newId = (concepts.length + 1).toString();
    setConcepts([...concepts, { id: newId, description: '' }]);
  };

  const updateConcept = (index: number, description: string) => {
    const newConcepts = [...concepts];
    newConcepts[index].description = description;
    setConcepts(newConcepts);
  };

  const removeConcept = (index: number) => {
    if (concepts.length > 1) {
      setConcepts(concepts.filter((_, i) => i !== index));
    }
  };

  const togglePersona = (personaId: string) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId) 
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const analyzeConcepts = async () => {
    const validConcepts = concepts.filter(c => c.description.trim());
    
    if (validConcepts.length === 0) {
      setError('Bitte beschreiben Sie mindestens ein Cover-Konzept.');
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
      
      const results: CoverFeedback[] = [];
      
      for (const concept of validConcepts) {
        const result = await simulateCoverFeedback(concept, selectedPersonaObjects, bookContext);
        results.push(result);
      }
      
      setFeedback(results);
      onComplete(results);
    } catch (error) {
      console.error('Cover analysis error:', error);
      setError('Fehler bei der Cover-Analyse. Bitte versuchen Sie es erneut.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateCoverFeedback = async (
    concept: CoverConcept, 
    personas: ReaderPersona[], 
    bookContext: any
  ): Promise<CoverFeedback> => {
    // Simulated feedback generation
    const emotions = ['Neugierig', 'Fasziniert', 'Gespannt', 'Begeistert', 'Interessiert', 'Nachdenklich'];
    
    const personaFeedback = personas.map(persona => ({
      personaId: persona.id,
      personaName: persona.name,
      visualAppeal: Math.floor(Math.random() * 4) + 6, // 6-9 range
      genreAppropriate: Math.floor(Math.random() * 3) + 7, // 7-9 range
      thematicAccuracy: Math.floor(Math.random() * 4) + 6, // 6-9 range
      standoutFactor: Math.floor(Math.random() * 4) + 6, // 6-9 range
      emotionalResponse: emotions[Math.floor(Math.random() * emotions.length)],
      comments: `Als ${persona.demographics.occupation} spricht mich das Cover-Design an. Es ${Math.random() > 0.5 ? 'vermittelt die richtige Stimmung' : 'passt gut zum Genre'} und würde mich zum Kauf animieren.`
    }));

    const overallScore = personaFeedback.reduce((sum, pf) => 
      sum + (pf.visualAppeal + pf.genreAppropriate + pf.thematicAccuracy + pf.standoutFactor) / 4, 0) / personaFeedback.length;
    
    return {
      conceptId: concept.id,
      conceptDescription: concept.description,
      personaFeedback,
      overallScore,
      summary: `Das Cover-Konzept erhielt eine durchschnittliche Bewertung von ${overallScore.toFixed(1)}/10. ${overallScore >= 8 ? 'Sehr starkes visuelles Konzept.' : overallScore >= 7 ? 'Gutes Konzept mit Potenzial.' : 'Überarbeitung empfohlen.'}`
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cover-Konzept Feedback Simulator</CardTitle>
          <p className="text-sm text-gray-600">
            Simuliere Feedback von Ihren Zielgruppen zu verschiedenen Cover-Konzepten
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover Concept Input */}
          <div>
            <Label className="text-base font-medium">Cover-Konzepte beschreiben</Label>
            <div className="space-y-4 mt-2">
              {concepts.map((concept, index) => (
                <div key={concept.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Konzept {index + 1}</Label>
                    {concepts.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeConcept(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={concept.description}
                    onChange={(e) => updateConcept(index, e.target.value)}
                    placeholder="Beschreiben Sie das Cover-Design detailliert (z.B. Farben, Bilder, Stil, Typografie, Stimmung)..."
                    className="min-h-20"
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addConcept} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Cover-Konzept hinzufügen
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
            onClick={analyzeConcepts}
            disabled={isAnalyzing || personas.length === 0}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analysiere Cover...' : 'Cover-Feedback simulieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {feedback.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cover-Feedback Ergebnisse</h3>
          {feedback.map((result, index) => (
            <Card key={result.conceptId}>
              <CardHeader>
                <CardTitle className="text-base">Konzept {index + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Gesamtbewertung:</span>
                  <Badge variant={result.overallScore >= 8 ? "default" : result.overallScore >= 7 ? "secondary" : "outline"}>
                    {result.overallScore.toFixed(1)}/10
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <p className="text-sm"><strong>Beschreibung:</strong> {result.conceptDescription}</p>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{result.summary}</p>
                
                <div className="space-y-3">
                  {result.personaFeedback.map((pf) => (
                    <div key={pf.personaId} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{pf.personaName}</h4>
                        <Badge variant="outline">{((pf.visualAppeal + pf.genreAppropriate + pf.thematicAccuracy + pf.standoutFactor) / 4).toFixed(1)}/10</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{pf.comments}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p><strong>Emotion:</strong> {pf.emotionalResponse}</p>
                          <p><strong>Visueller Reiz:</strong> {pf.visualAppeal}/10</p>
                        </div>
                        <div>
                          <p><strong>Genre-Passend:</strong> {pf.genreAppropriate}/10</p>
                          <p><strong>Wiedererkennbarkeit:</strong> {pf.standoutFactor}/10</p>
                        </div>
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
