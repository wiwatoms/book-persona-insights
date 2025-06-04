
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReaderArchetype, AnalysisResult } from './BookAnalyzer';
import { AIAnalysisService, AIConfig } from './AIAnalysisService';
import { Play, Pause, RotateCcw, Brain, Clock, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null);
  const [currentArchetypeIndex, setCurrentArchetypeIndex] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [detailedLog, setDetailedLog] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const { toast } = useToast();

  // Check for existing config on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    const savedModel = localStorage.getItem('openai_model');
    if (savedApiKey && savedModel) {
      setAIConfig({ apiKey: savedApiKey, model: savedModel });
    }
  }, []);

  // Split text into chunks for progressive analysis
  const textChunks = React.useMemo(() => {
    const wordsPerChunk = 300; // Smaller chunks for better analysis
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

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDetailedLog(prev => [...prev, `[${timestamp}] ${message}`]);
    setCurrentStatus(message);
  };

  const callOpenAIAPI = async (archetype: ReaderArchetype, chunk: string, chunkIndex: number): Promise<AnalysisResult> => {
    if (!aiConfig) throw new Error('AI configuration missing');

    addToLog(`Analysiere Textabschnitt ${chunkIndex + 1} für ${archetype.name}...`);

    const prompt = `Du bist ein Experte für Literaturanalyse und verhältst dich wie folgende Persona:

PERSONA: ${archetype.name}
BESCHREIBUNG: ${archetype.description}
DEMOGRAPHIK: ${archetype.demographics}
LESEGEWOHNHEITEN: ${archetype.readingPreferences}
PERSÖNLICHKEIT: ${archetype.personalityTraits.join(', ')}
MOTIVATIONEN: ${archetype.motivations.join(', ')}
PAIN POINTS: ${archetype.painPoints.join(', ')}

Analysiere den folgenden Textabschnitt (Teil ${chunkIndex + 1}) aus der Perspektive dieser Persona:

"${chunk}"

Bewerte auf einer Skala von 1-5 (Dezimalstellen erlaubt):
- Engagement: Wie fesselnd ist der Text?
- Stil: Wie gefällt dir der Schreibstil?
- Klarheit: Wie verständlich ist der Text?
- Tempo: Wie ist das Erzähltempo?
- Relevanz: Wie relevant ist der Inhalt für dich?

Schätze außerdem (0-1 als Dezimalzahl):
- Kaufwahrscheinlichkeit: Würdest du das Buch kaufen?
- Weiterempfehlungswahrscheinlichkeit: Würdest du es weiterempfehlen?

Bestimme die erwartete Review-Stimmung: positive, neutral oder negative

Gib 2-3 Marketing-Insights basierend auf deiner Persona-Perspektive.

Antworte ausschließlich in folgendem JSON-Format:
{
  "ratings": {
    "engagement": 0.0,
    "style": 0.0,
    "clarity": 0.0,
    "pacing": 0.0,
    "relevance": 0.0
  },
  "overallRating": 0.0,
  "feedback": "Dein detailliertes Feedback als Persona",
  "buyingProbability": 0.0,
  "recommendationLikelihood": 0.0,
  "expectedReviewSentiment": "positive/neutral/negative",
  "marketingInsights": ["Insight 1", "Insight 2", "Insight 3"]
}`;

    try {
      addToLog(`Sende Anfrage an OpenAI (${aiConfig.model})...`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Experte für Literaturanalyse. Antworte ausschließlich in gültigem JSON-Format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      addToLog(`Antwort erhalten, verarbeite JSON...`);
      
      // Clean up the response - sometimes there's extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Keine gültige JSON-Antwort erhalten');
      }

      const analysisData = JSON.parse(jsonMatch[0]);
      
      addToLog(`✓ Analyse abgeschlossen für ${archetype.name}, Abschnitt ${chunkIndex + 1}`);

      return {
        archetypeId: archetype.id,
        chunkIndex,
        ratings: analysisData.ratings,
        overallRating: analysisData.overallRating,
        feedback: analysisData.feedback,
        buyingProbability: analysisData.buyingProbability,
        recommendationLikelihood: analysisData.recommendationLikelihood,
        expectedReviewSentiment: analysisData.expectedReviewSentiment,
        marketingInsights: analysisData.marketingInsights
      };
    } catch (error) {
      addToLog(`❌ Fehler bei der Analyse: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      throw error;
    }
  };

  const startAnalysis = async () => {
    if (!aiConfig) {
      toast({
        title: "Konfiguration fehlt",
        description: "Bitte konfigurieren Sie zuerst die OpenAI API.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setIsPaused(false);
    setAnalysisResults([]);
    setDetailedLog([]);
    setCurrentArchetypeIndex(0);
    setCurrentChunkIndex(0);
    
    // Estimate total time
    const totalAnalyses = archetypes.length * textChunks.length;
    const estimatedTimeInMinutes = Math.ceil(totalAnalyses * 0.5); // ~30 seconds per analysis
    setEstimatedTime(estimatedTimeInMinutes);
    
    addToLog(`🚀 Starte Analyse: ${archetypes.length} Archetypen × ${textChunks.length} Textabschnitte = ${totalAnalyses} Analysen`);
    addToLog(`⏱️ Geschätzte Dauer: ${estimatedTimeInMinutes} Minuten`);
    
    const results: AnalysisResult[] = [];

    try {
      for (let archetypeIdx = 0; archetypeIdx < archetypes.length; archetypeIdx++) {
        if (!isAnalyzing || isPaused) break;
        
        setCurrentArchetypeIndex(archetypeIdx);
        const archetype = archetypes[archetypeIdx];
        addToLog(`📚 Beginne Analyse für: ${archetype.name}`);

        for (let chunkIdx = 0; chunkIdx < textChunks.length; chunkIdx++) {
          if (!isAnalyzing || isPaused) break;
          
          setCurrentChunkIndex(chunkIdx);
          const chunk = textChunks[chunkIdx];

          try {
            const result = await callOpenAIAPI(archetype, chunk, chunkIdx);
            results.push(result);
            setAnalysisResults([...results]);
          } catch (error) {
            addToLog(`❌ Fehler bei Abschnitt ${chunkIdx + 1}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
            // Continue with next chunk instead of stopping completely
            continue;
          }
        }
      }

      if (!isPaused && isAnalyzing) {
        addToLog(`🎉 Analyse erfolgreich abgeschlossen! ${results.length} Bewertungen erstellt.`);
        onAnalysisComplete(results);
        toast({
          title: "Analyse abgeschlossen",
          description: `${results.length} Bewertungen von ${archetypes.length} Archetypen erstellt.`,
        });
      }
    } catch (error) {
      addToLog(`💥 Kritischer Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      toast({
        title: "Analyse-Fehler",
        description: "Beim Analysieren ist ein kritischer Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pauseAnalysis = () => {
    addToLog("⏸️ Analyse pausiert");
    setIsPaused(true);
    setIsAnalyzing(false);
  };

  const resetAnalysis = () => {
    addToLog("🔄 Analyse zurückgesetzt");
    setIsAnalyzing(false);
    setIsPaused(false);
    setCurrentArchetypeIndex(0);
    setCurrentChunkIndex(0);
    setAnalysisResults([]);
    setDetailedLog([]);
    setCurrentStatus('');
  };

  if (!aiConfig) {
    return <AIAnalysisService onConfigured={setAIConfig} />;
  }

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="text-sm text-slate-600">Gesamt-Analysen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">~{estimatedTime}min</div>
              <div className="text-sm text-slate-600">Geschätzte Dauer</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      {currentStatus && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {currentStatus}
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Section */}
      {(isAnalyzing || analysisResults.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Analyse-Fortschritt</span>
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  {Math.round(progressPercentage)}% abgeschlossen
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
                        <p className="text-slate-600">{result.feedback.substring(0, 100)}...</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed Log */}
            {detailedLog.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Analyse-Log:</h4>
                <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-32 overflow-y-auto">
                  {detailedLog.slice(-10).map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
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
