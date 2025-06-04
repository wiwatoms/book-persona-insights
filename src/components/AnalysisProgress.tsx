
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ReaderArchetype, AnalysisResult } from './BookAnalyzer';
import { Play, Pause, RotateCcw, Brain, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalysisProgressProps {
  pdfContent: string;
  archetypes: ReaderArchetype[];
  onAnalysisComplete: (results: AnalysisResult[]) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  pdfContent,
  archetypes,
  onAnalysisComplete,
  isAnalyzing,
  setIsAnalyzing
}) => {
  const [currentArchetypeIndex, setCurrentArchetypeIndex] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  // Split text into chunks for progressive analysis
  const textChunks = React.useMemo(() => {
    const wordsPerChunk = 500;
    const words = pdfContent.split(' ');
    const chunks = [];
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
    }
    
    return chunks;
  }, [pdfContent]);

  const totalSteps = archetypes.length * textChunks.length;
  const currentStep = currentArchetypeIndex * textChunks.length + currentChunkIndex;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const simulateArchetypeAnalysis = async (
    archetype: ReaderArchetype, 
    chunk: string, 
    chunkIndex: number
  ): Promise<AnalysisResult> => {
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // Generate realistic simulation data based on archetype characteristics
    const generateRating = (base: number, variance: number = 0.2) => {
      return Math.max(1, Math.min(5, base + (Math.random() - 0.5) * variance * 2));
    };

    let ratings;
    let overallRating;
    let buyingProbability;
    let recommendationLikelihood;
    let expectedReviewSentiment: 'positive' | 'neutral' | 'negative';
    let feedback;
    let marketingInsights;

    // Customize analysis based on archetype
    switch (archetype.id) {
      case '1': // Pragmatischer Entscheider
        ratings = {
          engagement: generateRating(3.5, 0.3),
          style: generateRating(3.8, 0.2),
          clarity: generateRating(4.2, 0.3),
          pacing: generateRating(3.9, 0.4),
          relevance: generateRating(4.0, 0.3)
        };
        overallRating = (ratings.engagement + ratings.clarity + ratings.relevance) / 3;
        buyingProbability = overallRating > 3.5 ? 0.7 + Math.random() * 0.2 : 0.3 + Math.random() * 0.3;
        recommendationLikelihood = buyingProbability > 0.6 ? 0.6 + Math.random() * 0.3 : 0.2 + Math.random() * 0.4;
        expectedReviewSentiment = overallRating > 3.8 ? 'positive' : overallRating > 3.2 ? 'neutral' : 'negative';
        feedback = `Abschnitt ${chunkIndex + 1}: Der Text ist ${overallRating > 3.5 ? 'praxisnah und umsetzbar' : 'zu theoretisch'}. ${
          ratings.clarity > 4 ? 'Klare Struktur erkennbar.' : 'Mehr konkrete Handlungsempfehlungen nötig.'
        }`;
        marketingInsights = [
          'Fokus auf messbare Ergebnisse hervorheben',
          'Case Studies und Praxisbeispiele betonen',
          'Zeitersparnis als Hauptnutzen kommunizieren'
        ];
        break;

      case '2': // Wissbegierige Entdeckerin
        ratings = {
          engagement: generateRating(4.1, 0.3),
          style: generateRating(4.3, 0.2),
          clarity: generateRating(4.0, 0.3),
          pacing: generateRating(3.7, 0.3),
          relevance: generateRating(4.2, 0.2)
        };
        overallRating = (ratings.engagement + ratings.style + ratings.relevance) / 3;
        buyingProbability = overallRating > 4.0 ? 0.8 + Math.random() * 0.15 : 0.5 + Math.random() * 0.3;
        recommendationLikelihood = buyingProbability > 0.7 ? 0.8 + Math.random() * 0.2 : 0.4 + Math.random() * 0.4;
        expectedReviewSentiment = overallRating > 4.0 ? 'positive' : overallRating > 3.5 ? 'neutral' : 'negative';
        feedback = `Kapitel ${chunkIndex + 1}: ${overallRating > 4.0 ? 'Intellectuell ansprechend' : 'Benötigt mehr Tiefe'}. ${
          ratings.style > 4 ? 'Gut recherchiert und fundiert.' : 'Mehr wissenschaftliche Belege wünschenswert.'
        }`;
        marketingInsights = [
          'Akademische Credentials hervorheben',
          'Quellenverzeichnis und Referenzen betonen',
          'Komplexität als Stärke positionieren'
        ];
        break;

      case '3': // Emotionaler Suchender
        ratings = {
          engagement: generateRating(4.2, 0.4),
          style: generateRating(3.9, 0.3),
          clarity: generateRating(3.6, 0.3),
          pacing: generateRating(4.0, 0.3),
          relevance: generateRating(4.4, 0.3)
        };
        overallRating = (ratings.engagement + ratings.relevance + ratings.pacing) / 3;
        buyingProbability = overallRating > 4.0 ? 0.75 + Math.random() * 0.2 : 0.4 + Math.random() * 0.4;
        recommendationLikelihood = buyingProbability > 0.6 ? 0.85 + Math.random() * 0.15 : 0.3 + Math.random() * 0.5;
        expectedReviewSentiment = overallRating > 4.0 ? 'positive' : overallRating > 3.3 ? 'neutral' : 'negative';
        feedback = `Teil ${chunkIndex + 1}: ${overallRating > 3.8 ? 'Emotional berührend und inspirierend' : 'Fehlt emotionale Verbindung'}. ${
          ratings.relevance > 4 ? 'Spricht persönliche Herausforderungen an.' : 'Mehr persönliche Geschichten benötigt.'
        }`;
        marketingInsights = [
          'Transformation stories hervorheben',
          'Emotionale Testimonials nutzen',
          'Gemeinschaftsgefühl aufbauen'
        ];
        break;

      case '4': // Skeptischer Realitätsprüfer
        ratings = {
          engagement: generateRating(3.2, 0.4),
          style: generateRating(3.4, 0.3),
          clarity: generateRating(3.8, 0.3),
          pacing: generateRating(3.3, 0.3),
          relevance: generateRating(3.1, 0.4)
        };
        overallRating = (ratings.engagement + ratings.style + ratings.relevance) / 3;
        buyingProbability = overallRating > 3.5 ? 0.4 + Math.random() * 0.3 : 0.1 + Math.random() * 0.3;
        recommendationLikelihood = buyingProbability > 0.5 ? 0.3 + Math.random() * 0.4 : 0.1 + Math.random() * 0.2;
        expectedReviewSentiment = overallRating > 3.6 ? 'neutral' : 'negative';
        feedback = `Abschnitt ${chunkIndex + 1}: ${overallRating > 3.3 ? 'Akzeptabel, aber wenig Neues' : 'Zu oberflächlich und bekannt'}. ${
          ratings.clarity > 3.5 ? 'Wenigstens klar strukturiert.' : 'Unklare Argumentation.'
        }`;
        marketingInsights = [
          'Unique Selling Points deutlicher herausarbeiten',
          'Kritische Stimmen ernst nehmen',
          'Beweise für Wirksamkeit liefern'
        ];
        break;

      case '5': // Überforderter Anfänger
        ratings = {
          engagement: generateRating(3.8, 0.5),
          style: generateRating(3.2, 0.4),
          clarity: generateRating(2.9, 0.5),
          pacing: generateRating(2.8, 0.4),
          relevance: generateRating(4.1, 0.3)
        };
        overallRating = (ratings.engagement + ratings.clarity + ratings.relevance) / 3;
        buyingProbability = overallRating > 3.5 ? 0.6 + Math.random() * 0.3 : 0.2 + Math.random() * 0.4;
        recommendationLikelihood = buyingProbability > 0.5 ? 0.4 + Math.random() * 0.4 : 0.1 + Math.random() * 0.3;
        expectedReviewSentiment = overallRating > 3.5 ? 'positive' : overallRating > 2.8 ? 'neutral' : 'negative';
        feedback = `Kapitel ${chunkIndex + 1}: ${overallRating > 3.2 ? 'Hilfreich für Einsteiger' : 'Zu kompliziert für Anfänger'}. ${
          ratings.clarity < 3 ? 'Mehr Erklärungen und Beispiele nötig.' : 'Gut verständlich geschrieben.'
        }`;
        marketingInsights = [
          'Schritt-für-Schritt Anleitung betonen',
          'Einfachheit als Hauptmerkmal bewerben',
          'Unterstützung und Begleitung anbieten'
        ];
        break;

      default:
        // Fallback
        ratings = {
          engagement: generateRating(3.5),
          style: generateRating(3.5),
          clarity: generateRating(3.5),
          pacing: generateRating(3.5),
          relevance: generateRating(3.5)
        };
        overallRating = 3.5;
        buyingProbability = 0.5;
        recommendationLikelihood = 0.5;
        expectedReviewSentiment = 'neutral';
        feedback = 'Standard-Bewertung';
        marketingInsights = ['Standard-Insight'];
    }

    return {
      archetypeId: archetype.id,
      chunkIndex,
      ratings: {
        engagement: Math.round(ratings.engagement * 10) / 10,
        style: Math.round(ratings.style * 10) / 10,
        clarity: Math.round(ratings.clarity * 10) / 10,
        pacing: Math.round(ratings.pacing * 10) / 10,
        relevance: Math.round(ratings.relevance * 10) / 10
      },
      overallRating: Math.round(overallRating * 10) / 10,
      feedback,
      buyingProbability: Math.round(buyingProbability * 100) / 100,
      recommendationLikelihood: Math.round(recommendationLikelihood * 100) / 100,
      expectedReviewSentiment,
      marketingInsights
    };
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setIsPaused(false);
    setAnalysisResults([]);
    
    const results: AnalysisResult[] = [];

    try {
      for (let archetypeIdx = 0; archetypeIdx < archetypes.length; archetypeIdx++) {
        if (!isAnalyzing || isPaused) break;
        
        setCurrentArchetypeIndex(archetypeIdx);
        const archetype = archetypes[archetypeIdx];

        for (let chunkIdx = 0; chunkIdx < textChunks.length; chunkIdx++) {
          if (!isAnalyzing || isPaused) break;
          
          setCurrentChunkIndex(chunkIdx);
          const chunk = textChunks[chunkIdx];

          const result = await simulateArchetypeAnalysis(archetype, chunk, chunkIdx);
          results.push(result);
          setAnalysisResults([...results]);
        }
      }

      if (!isPaused && isAnalyzing) {
        onAnalysisComplete(results);
        toast({
          title: "Analyse abgeschlossen",
          description: `${results.length} Bewertungen von ${archetypes.length} Archetypen erstellt.`,
        });
      }
    } catch (error) {
      toast({
        title: "Analyse-Fehler",
        description: "Beim Analysieren ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pauseAnalysis = () => {
    setIsPaused(true);
    setIsAnalyzing(false);
  };

  const resetAnalysis = () => {
    setIsAnalyzing(false);
    setIsPaused(false);
    setCurrentArchetypeIndex(0);
    setCurrentChunkIndex(0);
    setAnalysisResults([]);
  };

  const estimatedTimeRemaining = () => {
    const remainingSteps = totalSteps - currentStep;
    const averageTimePerStep = 2; // seconds
    const remainingMinutes = Math.ceil((remainingSteps * averageTimePerStep) / 60);
    return remainingMinutes;
  };

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Analyse-Konfiguration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{archetypes.length}</div>
              <div className="text-sm text-slate-600">Archetypen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{textChunks.length}</div>
              <div className="text-sm text-slate-600">Text-Abschnitte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalSteps}</div>
              <div className="text-sm text-slate-600">Gesamt-Bewertungen</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      {(isAnalyzing || analysisResults.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Analyse-Fortschritt</span>
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  ~{estimatedTimeRemaining()} Min verbleibend
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gesamt-Fortschritt</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {isAnalyzing && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">
                    Aktuell: {archetypes[currentArchetypeIndex]?.name}
                  </Badge>
                  <span className="text-sm text-slate-600">
                    Abschnitt {currentChunkIndex + 1} von {textChunks.length}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  Analysiert: "{textChunks[currentChunkIndex]?.substring(0, 100)}..."
                </div>
              </div>
            )}

            {/* Live Results Preview */}
            {analysisResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Letzte Bewertungen:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {analysisResults.slice(-3).reverse().map((result, idx) => {
                    const archetype = archetypes.find(a => a.id === result.archetypeId);
                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant="secondary">{archetype?.name}</Badge>
                          <span className="font-medium">{result.overallRating}/5 ⭐</span>
                        </div>
                        <p className="text-slate-600">{result.feedback}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        {!isAnalyzing && analysisResults.length === 0 && (
          <Button onClick={startAnalysis} size="lg" className="bg-green-600 hover:bg-green-700">
            <Play className="w-5 h-5 mr-2" />
            Analyse starten
          </Button>
        )}

        {isAnalyzing && (
          <Button onClick={pauseAnalysis} size="lg" variant="outline">
            <Pause className="w-5 h-5 mr-2" />
            Pausieren
          </Button>
        )}

        {(analysisResults.length > 0 || isPaused) && (
          <Button onClick={resetAnalysis} size="lg" variant="outline">
            <RotateCcw className="w-5 h-5 mr-2" />
            Zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );
};
