
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Play } from 'lucide-react';
import { useBookContext } from './BookContextProvider';
import { AIProcessor } from './AIProcessor';
import { ReaderPersona } from './types';

interface TitleFeedback {
  title: string;
  personaFeedback: {
    personaId: string;
    appealScore: number;
    genreClarity: string;
    associations: string[];
    memorability: string;
    overallComment: string;
  }[];
  aggregatedSummary: string;
}

interface TitleFeedbackModuleProps {
  personas: ReaderPersona[];
  onComplete: (feedback: TitleFeedback[]) => void;
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
    if (titles.filter(t => t.trim()).length === 0) {
      setError('Bitte geben Sie mindestens einen Titel ein.');
      return;
    }

    if (selectedPersonas.length === 0) {
      setError('Bitte wählen Sie mindestens eine Leser-Persona aus.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const validTitles = titles.filter(t => t.trim());
      const analysisPrompt = `
        Analyze these potential book titles for the uploaded book. For each title, simulate detailed feedback from the selected reader personas.

        BOOK CONTEXT:
        ${bookContext.content.substring(0, 2000)}...
        
        BOOK METADATA:
        - Genre: ${bookContext.metadata.estimatedGenre || 'To be determined'}
        - Key Themes: ${bookContext.metadata.keyThemes?.join(', ') || 'To be analyzed'}
        - Word Count: ${bookContext.metadata.wordCount}

        TITLES TO ANALYZE: ${validTitles.join(', ')}

        SELECTED PERSONAS: ${selectedPersonas.map(id => 
          personas.find(p => p.id === id)?.name
        ).join(', ')}

        For each title and each selected persona, provide:
        1. Appeal Score (1-10)
        2. Genre Clarity assessment
        3. Positive/negative associations
        4. Memorability assessment
        5. Overall comment on fit with the actual book content

        Then provide an aggregated summary comparing all titles for this specific book.

        Return as JSON with structure matching TitleFeedback interface.
      `;

      const result = await AIProcessor.analyzeWithContext(analysisPrompt, bookContext);
      
      // Parse and validate the response
      const parsedFeedback = JSON.parse(result);
      setFeedback(parsedFeedback);
      onComplete(parsedFeedback);
    } catch (error) {
      console.error('Title analysis error:', error);
      setError('Fehler bei der Titel-Analyse. Bitte versuchen Sie es erneut.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Titel-Feedback Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title Input Section */}
          <div>
            <Label className="text-base font-medium">Titel-Optionen (3-5 empfohlen)</Label>
            <div className="space-y-3 mt-2">
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
            onClick={analyzeTitles} 
            disabled={isAnalyzing}
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
          {feedback.map((titleFeedback, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">"{titleFeedback.title}"</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {titleFeedback.personaFeedback.map((pf) => {
                    const persona = personas.find(p => p.id === pf.personaId);
                    return (
                      <div key={pf.personaId} className="border-l-4 border-blue-200 pl-4">
                        <h4 className="font-medium">{persona?.name}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Appeal Score:</strong> {pf.appealScore}/10</p>
                          <p><strong>Genre Clarity:</strong> {pf.genreClarity}</p>
                          <p><strong>Associations:</strong> {pf.associations.join(', ')}</p>
                          <p><strong>Memorability:</strong> {pf.memorability}</p>
                          <p><strong>Comment:</strong> {pf.overallComment}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium mb-2">Aggregated Summary</h4>
                    <p className="text-sm">{titleFeedback.aggregatedSummary}</p>
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
