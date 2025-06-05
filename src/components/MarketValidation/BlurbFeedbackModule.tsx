
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Play } from 'lucide-react';
import { useBookContext } from './BookContextProvider';
import { AIProcessor } from './AIProcessor';
import { ReaderPersona } from './types';

interface BlurbFeedback {
  blurb: string;
  personaFeedback: {
    personaId: string;
    plotClarity: string;
    intrigueFactor: number;
    characterAppeal: string;
    tonePacing: string;
    confusingElements: string[];
    overallComment: string;
  }[];
  aggregatedSummary: string;
}

interface BlurbFeedbackModuleProps {
  personas: ReaderPersona[];
  onComplete: (feedback: BlurbFeedback[]) => void;
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
    const validBlurbs = blurbs.filter(b => b.trim());
    
    if (validBlurbs.length === 0) {
      setError('Bitte geben Sie mindestens einen Klappentext ein.');
      return;
    }

    if (selectedPersonas.length === 0) {
      setError('Bitte wählen Sie mindestens eine Leser-Persona aus.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisPrompt = `
        Analyze these book blurbs/back cover copy for the uploaded book. For each blurb, simulate detailed feedback from the selected reader personas on how well it represents and sells the actual book.

        BOOK CONTEXT:
        ${bookContext.content.substring(0, 3000)}...
        
        BOOK METADATA:
        - Genre: ${bookContext.metadata.estimatedGenre || 'To be determined'}
        - Key Themes: ${bookContext.metadata.keyThemes?.join(', ') || 'To be analyzed'}
        - Character Types: ${bookContext.metadata.characterTypes?.join(', ') || 'To be analyzed'}
        - Narrative Style: ${bookContext.metadata.narrativeStyle || 'To be analyzed'}

        BLURBS TO ANALYZE:
        ${validBlurbs.map((b, i) => `Blurb ${i + 1}: ${b}`).join('\n\n')}

        SELECTED PERSONAS: ${selectedPersonas.map(id => 
          personas.find(p => p.id === id)?.name
        ).join(', ')}

        For each blurb and each selected persona, analyze how accurately and enticingly it represents THIS SPECIFIC BOOK and provide:
        1. Plot Clarity - how well does it set up the story vs. the actual book?
        2. Intrigue Factor Score (1-10) - desire to read more
        3. Character Appeal - how appealing are the characters as described vs. the actual book?
        4. Tone/Pacing conveyed vs. the book's actual tone/pacing
        5. Confusing Elements or misrepresentations
        6. Overall comment on effectiveness for this book

        Then provide an aggregated summary comparing all blurbs for this specific book.

        Return as JSON with structure matching BlurbFeedback interface.
      `;

      const result = await AIProcessor.analyzeWithContext(analysisPrompt, bookContext);
      const parsedFeedback = JSON.parse(result);
      setFeedback(parsedFeedback);
      onComplete(parsedFeedback);
    } catch (error) {
      console.error('Blurb analysis error:', error);
      setError('Fehler bei der Klappentext-Analyse. Bitte versuchen Sie es erneut.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Klappentext-Feedback Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Blurb Input Section */}
          <div>
            <Label className="text-base font-medium">Klappentext-Versionen (1-2 empfohlen)</Label>
            <div className="space-y-4 mt-2">
              {blurbs.map((blurb, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Version {index + 1}</h4>
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
                    placeholder="Geben Sie hier den Klappentext ein..."
                    rows={6}
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addBlurb} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Version hinzufügen
              </Button>
            </div>
          </div>

          {/* Persona Selection */}
          <div>
            <Label className="text-base font-medium">Leser-Personas auswählen</Label>
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
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={analyzeBlurbs} 
            disabled={isAnalyzing}
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
          {feedback.map((blurbFeedback, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">Version {index + 1}</CardTitle>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                  {blurbFeedback.blurb}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blurbFeedback.personaFeedback.map((pf) => {
                    const persona = personas.find(p => p.id === pf.personaId);
                    return (
                      <div key={pf.personaId} className="border-l-4 border-purple-200 pl-4">
                        <h4 className="font-medium">{persona?.name}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Plot Clarity:</strong> {pf.plotClarity}</p>
                          <p><strong>Intrigue Factor:</strong> {pf.intrigueFactor}/10</p>
                          <p><strong>Character Appeal:</strong> {pf.characterAppeal}</p>
                          <p><strong>Tone/Pacing:</strong> {pf.tonePacing}</p>
                          <p><strong>Confusing Elements:</strong> {pf.confusingElements.join(', ') || 'None'}</p>
                          <p><strong>Overall:</strong> {pf.overallComment}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium mb-2">Aggregated Summary</h4>
                    <p className="text-sm">{blurbFeedback.aggregatedSummary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
