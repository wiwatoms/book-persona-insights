
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Target } from 'lucide-react';
import { useBookContext } from './BookContextProvider';
import { MarketValidationAI } from './AIProcessor';
import { AIConfig } from '../AIAnalysisService';
import { MarketPosition, TrendAnalysis } from './types';
import { toast } from 'sonner';

interface LiteraryLandscapeModuleProps {
  aiConfig: AIConfig;
  onAnalysisComplete: (marketPosition: MarketPosition, trendAnalysis: TrendAnalysis) => void;
}

export const LiteraryLandscapeModule: React.FC<LiteraryLandscapeModuleProps> = ({
  aiConfig,
  onAnalysisComplete
}) => {
  const bookContext = useBookContext();
  const [genres, setGenres] = useState<string[]>([]);
  const [competitorTitles, setCompetitorTitles] = useState<string[]>([]);
  const [currentGenre, setCurrentGenre] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{
    marketPosition: MarketPosition;
    trendAnalysis: TrendAnalysis;
  } | null>(null);

  const addGenre = () => {
    if (currentGenre.trim() && !genres.includes(currentGenre.trim())) {
      setGenres([...genres, currentGenre.trim()]);
      setCurrentGenre('');
    }
  };

  const addCompetitorTitle = () => {
    if (currentTitle.trim() && !competitorTitles.includes(currentTitle.trim())) {
      setCompetitorTitles([...competitorTitles, currentTitle.trim()]);
      setCurrentTitle('');
    }
  };

  const removeGenre = (genre: string) => {
    setGenres(genres.filter(g => g !== genre));
  };

  const removeTitle = (title: string) => {
    setCompetitorTitles(competitorTitles.filter(t => t !== title));
  };

  const runAnalysis = async () => {
    if (genres.length === 0) {
      toast.error("Bitte fügen Sie mindestens ein Genre hinzu.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysisResults = await MarketValidationAI.analyzeLiteraryLandscape(
        bookContext,
        genres,
        competitorTitles,
        aiConfig
      );
      
      setResults(analysisResults);
      onAnalysisComplete(analysisResults.marketPosition, analysisResults.trendAnalysis);
      toast.success("Marktanalyse erfolgreich abgeschlossen!");
    } catch (error) {
      toast.error("Fehler bei der Analyse: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            AI Literary Landscape & Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Diese Analyse basiert auf Ihrem hochgeladenen Buchinhalt ({bookContext.metadata.wordCount.toLocaleString()} Wörter) 
              und wird spezifische Marktchancen für Ihr Buch identifizieren.
            </AlertDescription>
          </Alert>

          {/* Genre Input */}
          <div className="space-y-3">
            <Label htmlFor="genre-input">Genres (mindestens 1 erforderlich)</Label>
            <div className="flex gap-2">
              <Input
                id="genre-input"
                value={currentGenre}
                onChange={(e) => setCurrentGenre(e.target.value)}
                placeholder="z.B. Science Fiction, Romance, Thriller..."
                onKeyPress={(e) => e.key === 'Enter' && addGenre()}
              />
              <Button onClick={addGenre} variant="outline">Hinzufügen</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <Badge key={genre} variant="secondary" className="cursor-pointer" onClick={() => removeGenre(genre)}>
                  {genre} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* Competitor Titles Input */}
          <div className="space-y-3">
            <Label htmlFor="title-input">Vergleichstitel (optional, aber empfohlen)</Label>
            <div className="flex gap-2">
              <Input
                id="title-input"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="z.B. 'Der Marsianer', 'Gone Girl', 'Die Tribute von Panem'..."
                onKeyPress={(e) => e.key === 'Enter' && addCompetitorTitle()}
              />
              <Button onClick={addCompetitorTitle} variant="outline">Hinzufügen</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {competitorTitles.map((title) => (
                <Badge key={title} variant="outline" className="cursor-pointer" onClick={() => removeTitle(title)}>
                  {title} ×
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={runAnalysis} 
            disabled={isAnalyzing || genres.length === 0}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analysiere Ihr Buch im Marktkontext...
              </>
            ) : (
              'Marktanalyse starten'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Marktpositionierung für Ihr Buch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Genre-Positionierung</h4>
                <p><strong>Hauptgenre:</strong> {results.marketPosition.genre}</p>
                <p><strong>Sub-Genres:</strong> {results.marketPosition.subGenres.join(', ')}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Alleinstellungsmerkmale Ihres Buches</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {results.marketPosition.uniqueSellingPoints.map((usp, index) => (
                    <li key={index}>{usp}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Ziel-Nischen</h4>
                <div className="flex flex-wrap gap-2">
                  {results.marketPosition.targetNiches.map((niche, index) => (
                    <Badge key={index} variant="secondary">{niche}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Positionierungs-Matrix (1-10 Skala)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>Ton: {results.marketPosition.positioningMatrix.tone}/10</div>
                  <div>Komplexität: {results.marketPosition.positioningMatrix.complexity}/10</div>
                  <div>Tempo: {results.marketPosition.positioningMatrix.pacing}/10</div>
                  <div>Emotionale Intensität: {results.marketPosition.positioningMatrix.emotionalIntensity}/10</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trend-Analyse für Ihr Buch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Für Ihr Buch relevante Trends</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {results.trendAnalysis.relevantToBook.map((trend, index) => (
                    <li key={index}>{trend}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Marktchancen für Ihr Buch</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {results.trendAnalysis.opportunities.map((opportunity, index) => (
                    <li key={index}>{opportunity}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
