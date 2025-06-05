
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { useBookContext } from './BookContextProvider';
import { MarketValidationAI } from './AIProcessor';
import { MarketPosition, ReaderPersona } from './types';

interface TargetAudienceModuleProps {
  marketPosition: MarketPosition | null;
  onComplete: (personas: ReaderPersona[]) => void;
}

export const TargetAudienceModule: React.FC<TargetAudienceModuleProps> = ({
  marketPosition,
  onComplete
}) => {
  const bookContext = useBookContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [personas, setPersonas] = useState<ReaderPersona[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generatePersonas = async () => {
    if (!marketPosition) {
      setError('Bitte führen Sie zuerst die Marktanalyse durch.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // This would need actual AI configuration - for now using dummy config
      const aiConfig = { apiKey: 'dummy', model: 'gpt-3.5-turbo' };
      
      const generatedPersonas = await MarketValidationAI.generateTargetPersonas(
        bookContext,
        marketPosition,
        aiConfig
      );
      
      setPersonas(generatedPersonas);
      onComplete(generatedPersonas);
    } catch (error) {
      console.error('Persona generation error:', error);
      setError('Fehler bei der Persona-Generierung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zielgruppen-Personas</CardTitle>
          <p className="text-sm text-gray-600">
            Generiere detaillierte Leser-Personas basierend auf deinem Buch und der Marktpositionierung
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {marketPosition && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Aktuelle Marktpositionierung</h4>
              <div className="space-y-2">
                <p className="text-sm"><strong>Genre:</strong> {marketPosition.genre}</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-sm font-medium">Sub-Genres:</span>
                  {marketPosition.subGenres.map((subGenre, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {subGenre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={generatePersonas}
            disabled={isGenerating || !marketPosition}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generiere Personas...' : 'Leser-Personas generieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Personas Display */}
      {personas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generierte Leser-Personas</h3>
          {personas.map((persona) => (
            <Card key={persona.id}>
              <CardHeader>
                <CardTitle className="text-base">{persona.name}</CardTitle>
                <p className="text-sm text-gray-600">{persona.summary}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Demografische Daten</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Alter:</strong> {persona.demographics.ageRange}</p>
                      <p><strong>Geschlecht:</strong> {persona.demographics.gender}</p>
                      <p><strong>Bildung:</strong> {persona.demographics.education}</p>
                      <p><strong>Beruf:</strong> {persona.demographics.occupation}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Lesegewohnheiten</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Häufigkeit:</strong> {persona.readingHabits.frequency}</p>
                      <p><strong>Formate:</strong> {persona.readingHabits.preferredFormats.join(', ')}</p>
                      <p><strong>Lieblings-Genres:</strong> {persona.readingHabits.favoriteGenres.join(', ')}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Psychografie</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Werte:</strong> {persona.psychographics.values.join(', ')}</p>
                      <p><strong>Motivationen:</strong> {persona.psychographics.motivations.join(', ')}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Buchverbindungen</h4>
                    <ul className="text-sm list-disc list-inside">
                      {persona.bookConnectionPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
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
