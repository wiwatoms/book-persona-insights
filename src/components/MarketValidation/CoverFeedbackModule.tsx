
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Plus, Play } from 'lucide-react';
import { useBookContext } from './BookContextProvider';
import { AIProcessor } from './AIProcessor';
import { ReaderPersona } from './types';

interface CoverConcept {
  id: string;
  type: 'image' | 'description';
  imageUrl?: string;
  description: string;
}

interface CoverFeedback {
  conceptId: string;
  personaFeedback: {
    personaId: string;
    visualAppeal: number;
    genreAppropriate: string;
    moodAccuracy: string;
    titleClarity: string;
    emotionalResponse: string;
    uniqueness: string;
  }[];
  aggregatedSummary: string;
}

interface CoverFeedbackModuleProps {
  personas: ReaderPersona[];
  onComplete: (feedback: CoverFeedback[]) => void;
}

export const CoverFeedbackModule: React.FC<CoverFeedbackModuleProps> = ({
  personas,
  onComplete
}) => {
  const bookContext = useBookContext();
  const [concepts, setConcepts] = useState<CoverConcept[]>([
    { id: '1', type: 'description', description: '' }
  ]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<CoverFeedback[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addConcept = () => {
    setConcepts([...concepts, {
      id: Date.now().toString(),
      type: 'description',
      description: ''
    }]);
  };

  const updateConcept = (id: string, updates: Partial<CoverConcept>) => {
    setConcepts(concepts.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeConcept = (id: string) => {
    if (concepts.length > 1) {
      setConcepts(concepts.filter(c => c.id !== id));
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
      setError('Bitte wählen Sie mindestens eine Leser-Persona aus.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisPrompt = `
        Analyze these cover concepts for the uploaded book. For each concept, simulate detailed feedback from the selected reader personas on how well it represents the book.

        BOOK CONTEXT:
        ${bookContext.content.substring(0, 2000)}...
        
        BOOK METADATA:
        - Genre: ${bookContext.metadata.estimatedGenre || 'To be determined'}
        - Key Themes: ${bookContext.metadata.keyThemes?.join(', ') || 'To be analyzed'}
        - Setting: ${bookContext.metadata.settingType || 'To be analyzed'}
        - Narrative Style: ${bookContext.metadata.narrativeStyle || 'To be analyzed'}

        COVER CONCEPTS TO ANALYZE:
        ${validConcepts.map((c, i) => `Concept ${i + 1}: ${c.description}`).join('\n')}

        SELECTED PERSONAS: ${selectedPersonas.map(id => 
          personas.find(p => p.id === id)?.name
        ).join(', ')}

        For each concept and each selected persona, analyze how well the cover represents THIS SPECIFIC BOOK and provide:
        1. Visual Appeal Score (1-10)
        2. Genre Appropriateness for this book
        3. Mood/Theme Accuracy relative to the book's content
        4. Title/Author Name Clarity
        5. Emotional Response it evokes
        6. Uniqueness/Stand-out factor for this book's market

        Then provide an aggregated summary comparing all concepts for this specific book.

        Return as JSON with structure matching CoverFeedback interface.
      `;

      const result = await AIProcessor.analyzeWithContext(analysisPrompt, bookContext);
      const parsedFeedback = JSON.parse(result);
      setFeedback(parsedFeedback);
      onComplete(parsedFeedback);
    } catch (error) {
      console.error('Cover analysis error:', error);
      setError('Fehler bei der Cover-Analyse. Bitte versuchen Sie es erneut.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cover-Konzept Feedback Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover Concepts */}
          <div>
            <Label className="text-base font-medium">Cover-Konzepte (2-3 empfohlen)</Label>
            <div className="space-y-4 mt-2">
              {concepts.map((concept, index) => (
                <div key={concept.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">Konzept {index + 1}</h4>
                    {concepts.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeConcept(concept.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Textarea
                    value={concept.description}
                    onChange={(e) => updateConcept(concept.id, { description: e.target.value })}
                    placeholder="Beschreiben Sie das Cover-Konzept detailliert (Farben, Bilder, Typografie, Stimmung, etc.)"
                    rows={3}
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addConcept} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Konzept hinzufügen
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
            onClick={analyzeConcepts} 
            disabled={isAnalyzing}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analysiere Cover-Konzepte...' : 'Cover-Feedback simulieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {feedback.length > 0 && (
        <div className="space-y-4">
          {feedback.map((coverFeedback, index) => {
            const concept = concepts.find(c => c.id === coverFeedback.conceptId);
            return (
              <Card key={coverFeedback.conceptId}>
                <CardHeader>
                  <CardTitle className="text-lg">Konzept {index + 1}</CardTitle>
                  <p className="text-sm text-gray-600">{concept?.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {coverFeedback.personaFeedback.map((pf) => {
                      const persona = personas.find(p => p.id === pf.personaId);
                      return (
                        <div key={pf.personaId} className="border-l-4 border-green-200 pl-4">
                          <h4 className="font-medium">{persona?.name}</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Visual Appeal:</strong> {pf.visualAppeal}/10</p>
                            <p><strong>Genre Appropriate:</strong> {pf.genreAppropriate}</p>
                            <p><strong>Mood Accuracy:</strong> {pf.moodAccuracy}</p>
                            <p><strong>Title Clarity:</strong> {pf.titleClarity}</p>
                            <p><strong>Emotional Response:</strong> {pf.emotionalResponse}</p>
                            <p><strong>Uniqueness:</strong> {pf.uniqueness}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="font-medium mb-2">Aggregated Summary</h4>
                      <p className="text-sm">{coverFeedback.aggregatedSummary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
