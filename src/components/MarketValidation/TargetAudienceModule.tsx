
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Edit3, Check } from 'lucide-react';
import { useBookContext } from './BookContextProvider';
import { MarketValidationAI } from './AIProcessor';
import { AIConfig } from '../AIAnalysisService';
import { MarketPosition, ReaderPersona } from './types';
import { toast } from 'sonner';

interface TargetAudienceModuleProps {
  aiConfig: AIConfig;
  marketPosition: MarketPosition;
  onPersonasReady: (personas: ReaderPersona[]) => void;
}

export const TargetAudienceModule: React.FC<TargetAudienceModuleProps> = ({
  aiConfig,
  marketPosition,
  onPersonasReady
}) => {
  const bookContext = useBookContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [personas, setPersonas] = useState<ReaderPersona[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);

  const generatePersonas = async () => {
    setIsGenerating(true);
    try {
      const generatedPersonas = await MarketValidationAI.generateTargetPersonas(
        bookContext,
        marketPosition,
        aiConfig
      );
      
      setPersonas(generatedPersonas);
      toast.success("Leser-Personas erfolgreich generiert!");
    } catch (error) {
      toast.error("Fehler bei der Persona-Generierung: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePersonaSelection = (personaId: string) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId) 
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const confirmSelection = () => {
    const selected = personas.filter(p => selectedPersonas.includes(p.id));
    if (selected.length === 0) {
      toast.error("Bitte wählen Sie mindestens eine Persona aus.");
      return;
    }
    onPersonasReady(selected);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            AI Target Audience Persona Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Basierend auf Ihrem Buchinhalt und der Marktpositionierung "{marketPosition.genre}" 
              werden spezifische Leser-Personas generiert, die von Ihrem Buch angezogen würden.
            </AlertDescription>
          </Alert>

          {personas.length === 0 ? (
            <Button 
              onClick={generatePersonas} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generiere Personas basierend auf Ihrem Buch...
                </>
              ) : (
                'Zielgruppen-Personas generieren'
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Generierte Personas für Ihr Buch</h3>
                <Button onClick={generatePersonas} variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Neu generieren
                </Button>
              </div>

              <div className="grid gap-4">
                {personas.map((persona) => (
                  <Card 
                    key={persona.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedPersonas.includes(persona.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => togglePersonaSelection(persona.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{persona.name}</h4>
                          <p className="text-sm text-gray-600">
                            {persona.demographics.ageRange}, {persona.demographics.gender}, {persona.demographics.occupation}
                          </p>
                        </div>
                        {selectedPersonas.includes(persona.id) && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-sm">Verbindung zu Ihrem Buch:</h5>
                          <ul className="text-sm text-gray-700 list-disc pl-4">
                            {persona.bookConnectionPoints.map((point, index) => (
                              <li key={index}>{point}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <h5 className="font-medium text-sm">Lieblingsgenres:</h5>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {persona.readingHabits.favoriteGenres.slice(0, 3).map((genre, index) => (
                                <Badge key={index} variant="outline" className="text-xs">{genre}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm">Motivationen:</h5>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {persona.psychographics.motivations.slice(0, 2).map((motivation, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">{motivation}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-sm">Lesehäufigkeit:</h5>
                          <p className="text-sm text-gray-600">{persona.readingHabits.frequency}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">
                  Wählen Sie die Personas aus, die Sie für weitere Analysen verwenden möchten.
                  Ausgewählt: {selectedPersonas.length} von {personas.length}
                </p>
                <Button 
                  onClick={confirmSelection}
                  disabled={selectedPersonas.length === 0}
                  className="w-full"
                >
                  Mit ausgewählten Personas fortfahren
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
