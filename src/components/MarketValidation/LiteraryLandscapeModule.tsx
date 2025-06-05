import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Play } from 'lucide-react';
import { useBookContext } from './BookContextProvider';
import { MarketValidationAI } from './AIProcessor';
import { MarketPosition, TrendAnalysis } from './types';

interface LiteraryLandscapeModuleProps {
  onComplete: (marketPosition: MarketPosition, trendAnalysis: TrendAnalysis) => void;
}

export const LiteraryLandscapeModule: React.FC<LiteraryLandscapeModuleProps> = ({ onComplete }) => {
  const bookContext = useBookContext();
  const [genres, setGenres] = useState<string[]>(['']);
  const [competitorTitles, setCompetitorTitles] = useState<string[]>(['']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{
    marketPosition: MarketPosition;
    trendAnalysis: TrendAnalysis;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addGenre = () => {
    setGenres([...genres, '']);
  };

  const updateGenre = (index: number, value: string) => {
    const newGenres = [...genres];
    newGenres[index] = value;
    setGenres(newGenres);
  };

  const removeGenre = (index: number) => {
    if (genres.length > 1) {
      setGenres(genres.filter((_, i) => i !== index));
    }
  };

  const addCompetitor = () => {
    setCompetitorTitles([...competitorTitles, '']);
  };

  const updateCompetitor = (index: number, value: string) => {
    const newTitles = [...competitorTitles];
    newTitles[index] = value;
    setCompetitorTitles(newTitles);
  };

  const removeCompetitor = (index: number) => {
    if (competitorTitles.length > 1) {
      setCompetitorTitles(competitorTitles.filter((_, i) => i !== index));
    }
  };

  const analyzeMarket = async () => {
    const validGenres = genres.filter(g => g.trim());
    const validTitles = competitorTitles.filter(t => t.trim());

    if (validGenres.length === 0) {
      setError('Bitte geben Sie mindestens ein Genre an.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // This would need actual AI configuration - for now using dummy config
      const aiConfig = { apiKey: 'dummy', model: 'gpt-3.5-turbo' };
      
      const result = await MarketValidationAI.analyzeLiteraryLandscape(
        bookContext,
        validGenres,
        validTitles,
        aiConfig
      );
      
      setResults(result);
      onComplete(result.marketPosition, result.trendAnalysis);
    } catch (error) {
      console.error('Market analysis error:', error);
      setError('Fehler bei der Marktanalyse. Bitte versuchen Sie es erneut.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Literarische Marktlandschaft & Trends</CardTitle>
          <p className="text-sm text-gray-600">
            Analysiere dein Buch im Kontext aktueller Markttrends und Wettbewerber
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Genre Input */}
          <div>
            <Label className="text-base font-medium">Genres & Sub-Genres</Label>
            <div className="space-y-2 mt-2">
              {genres.map((genre, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={genre}
                    onChange={(e) => updateGenre(index, e.target.value)}
                    placeholder={`Genre ${index + 1}`}
                    className="flex-1"
                  />
                  {genres.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeGenre(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addGenre} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Genre hinzufügen
              </Button>
            </div>
          </div>

          {/* Competitor Titles */}
          <div>
            <Label className="text-base font-medium">Vergleichstitel (Optional)</Label>
            <div className="space-y-2 mt-2">
              {competitorTitles.map((title, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={title}
                    onChange={(e) => updateCompetitor(index, e.target.value)}
                    placeholder={`Vergleichstitel ${index + 1}`}
                    className="flex-1"
                  />
                  {competitorTitles.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCompetitor(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addCompetitor} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Titel hinzufügen
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={analyzeMarket} 
            disabled={isAnalyzing}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analysiere Markt...' : 'Marktanalyse starten'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marktpositionierung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Hauptgenre</h4>
                  <p className="text-sm text-gray-600">{results.marketPosition.genre}</p>
                </div>
                <div>
                  <h4 className="font-medium">Sub-Genres</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {results.marketPosition.subGenres.map((subGenre, index) => (
                      <Badge key={index} variant="secondary">{subGenre}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Alleinstellungsmerkmale</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {results.marketPosition.uniqueSellingPoints.map((usp, index) => (
                      <li key={index}>{usp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trend-Analyse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Aktuelle Trends</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {results.trendAnalysis.currentTrends.map((trend, index) => (
                      <li key={index}>{trend}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Marktchancen</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {results.trendAnalysis.opportunities.map((opportunity, index) => (
                      <li key={index}>{opportunity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
