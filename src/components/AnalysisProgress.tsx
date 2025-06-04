import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReaderArchetype, AnalysisResult } from './BookAnalyzer';
import { AIAnalysisService, AIConfig } from './AIAnalysisService';
import { Play, Pause, RotateCcw, Brain, Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';
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
  const [startTime, setStartTime] = useState<number>(0);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [tokenUsage, setTokenUsage] = useState({ prompt: 0, completion: 0 });
  const { toast } = useToast();

  // Check for existing config on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    const savedModel = localStorage.getItem('openai_model');
    if (savedApiKey && savedModel) {
      setAIConfig({ apiKey: savedApiKey, model: savedModel });
    }
  }, []);

  // Define addToLog function first
  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setDetailedLog(prev => [...prev.slice(-50), logEntry]); // Keep last 50 entries
    setCurrentStatus(message);
  };

  // Split text into chunks for progressive analysis
  const textChunks = React.useMemo(() => {
    if (!pdfContent || pdfContent.length < 100) {
      addToLog('⚠️ Warnung: Text ist zu kurz oder leer');
      return [];
    }

    const wordsPerChunk = 400; // Optimized chunk size
    const words = pdfContent.trim().split(/\s+/);
    const chunks = [];
    
    addToLog(`📝 Text wird in Abschnitte aufgeteilt: ${words.length} Wörter total`);
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      const chunk = words.slice(i, i + wordsPerChunk).join(' ');
      if (chunk.trim().length > 50) { // Skip very short chunks
        chunks.push(chunk);
      }
    }
    
    addToLog(`✂️ ${chunks.length} Textabschnitte erstellt (${wordsPerChunk} Wörter pro Abschnitt)`);
    return chunks;
  }, [pdfContent]);

  const totalSteps = archetypes.length * textChunks.length;
  const currentStep = currentArchetypeIndex * textChunks.length + currentChunkIndex;
  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const callOpenAIAPI = async (archetype: ReaderArchetype, chunk: string, chunkIndex: number): Promise<AnalysisResult> => {
    if (!aiConfig) throw new Error('AI configuration missing');

    addToLog(`🤖 Analysiere Abschnitt ${chunkIndex + 1}/${textChunks.length} für "${archetype.name}"`);

    const prompt = `Du bist ein Literatur-Kritiker und verhältst dich wie folgende Persona:

PERSONA: ${archetype.name}
BESCHREIBUNG: ${archetype.description}
DEMOGRAPHIK: ${archetype.demographics}
LESEGEWOHNHEITEN: ${archetype.readingPreferences}
PERSÖNLICHKEIT: ${archetype.personalityTraits.join(', ')}
MOTIVATIONEN: ${archetype.motivations.join(', ')}
PAIN POINTS: ${archetype.painPoints.join(', ')}

Analysiere diesen Textabschnitt (${chunkIndex + 1}/${textChunks.length}) aus deiner Persona-Perspektive:

"${chunk}"

Bewerte auf Skala 1-5 (Dezimalstellen erlaubt):
- Engagement: Wie fesselnd ist der Text?
- Stil: Wie gefällt dir der Schreibstil?
- Klarheit: Wie verständlich ist der Text?
- Tempo: Wie ist das Erzähltempo?
- Relevanz: Wie relevant ist der Inhalt für dich?

Schätze (0-1 als Dezimalzahl):
- Kaufwahrscheinlichkeit: Würdest du das Buch kaufen?
- Weiterempfehlungswahrscheinlichkeit: Würdest du es weiterempfehlen?

Review-Stimmung: positive, neutral oder negative

Gib 2-3 Marketing-Insights aus deiner Persona-Sicht.

Antworte NUR in diesem JSON-Format (ohne weitere Erklärungen):
{
  "ratings": {
    "engagement": 0.0,
    "style": 0.0,
    "clarity": 0.0,
    "pacing": 0.0,
    "relevance": 0.0
  },
  "overallRating": 0.0,
  "feedback": "Dein detailliertes Feedback als Persona (max 150 Wörter)",
  "buyingProbability": 0.0,
  "recommendationLikelihood": 0.0,
  "expectedReviewSentiment": "positive/neutral/negative",
  "marketingInsights": ["Insight 1", "Insight 2"]
}`;

    try {
      setApiCallCount(prev => prev + 1);
      addToLog(`📡 API-Aufruf #${apiCallCount + 1} an OpenAI (${aiConfig.model})`);
      
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
              content: 'Du bist ein präziser Literaturkritiker. Antworte ausschließlich in gültigem JSON ohne zusätzlichen Text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API Error ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      
      // Track token usage
      if (data.usage) {
        setTokenUsage(prev => ({
          prompt: prev.prompt + (data.usage.prompt_tokens || 0),
          completion: prev.completion + (data.usage.completion_tokens || 0)
        }));
        addToLog(`💰 Token-Verbrauch: ${data.usage.prompt_tokens} + ${data.usage.completion_tokens} = ${data.usage.total_tokens}`);
      }

      const content = data.choices[0].message.content;
      
      // Clean and parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Keine gültige JSON-Antwort von OpenAI erhalten');
      }

      let analysisData;
      try {
        analysisData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        addToLog(`❌ JSON Parse Error: ${parseError}`);
        throw new Error('Ungültige JSON-Antwort von OpenAI');
      }

      // Validate required fields
      if (!analysisData.ratings || !analysisData.feedback) {
        throw new Error('Unvollständige Antwort von OpenAI');
      }
      
      addToLog(`✅ Analyse erfolgreich: ${analysisData.overallRating}/5 Punkte`);

      return {
        archetypeId: archetype.id,
        chunkIndex,
        ratings: analysisData.ratings,
        overallRating: analysisData.overallRating || 0,
        feedback: analysisData.feedback,
        buyingProbability: analysisData.buyingProbability || 0,
        recommendationLikelihood: analysisData.recommendationLikelihood || 0,
        expectedReviewSentiment: analysisData.expectedReviewSentiment || 'neutral',
        marketingInsights: analysisData.marketingInsights || []
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      addToLog(`❌ API-Fehler: ${errorMsg}`);
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

    if (textChunks.length === 0) {
      toast({
        title: "Kein Text vorhanden",
        description: "Bitte laden Sie zuerst eine Datei mit ausreichend Text hoch.",
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
    setStartTime(Date.now());
    setApiCallCount(0);
    setTokenUsage({ prompt: 0, completion: 0 });
    
    const totalAnalyses = archetypes.length * textChunks.length;
    const estimatedTimeInMinutes = Math.ceil(totalAnalyses * 0.75); // More realistic estimate
    setEstimatedTime(estimatedTimeInMinutes);
    
    addToLog(`🚀 ANALYSE GESTARTET`);
    addToLog(`📊 ${archetypes.length} Archetypen × ${textChunks.length} Abschnitte = ${totalAnalyses} Analysen`);
    addToLog(`⏱️ Geschätzte Dauer: ${estimatedTimeInMinutes} Minuten`);
    addToLog(`🔧 Model: ${aiConfig.model}`);
    
    const results: AnalysisResult[] = [];

    try {
      for (let archetypeIdx = 0; archetypeIdx < archetypes.length && isAnalyzing && !isPaused; archetypeIdx++) {
        setCurrentArchetypeIndex(archetypeIdx);
        const archetype = archetypes[archetypeIdx];
        addToLog(`👤 Starte Analyse für: "${archetype.name}"`);

        for (let chunkIdx = 0; chunkIdx < textChunks.length && isAnalyzing && !isPaused; chunkIdx++) {
          setCurrentChunkIndex(chunkIdx);
          const chunk = textChunks[chunkIdx];

          try {
            const result = await callOpenAIAPI(archetype, chunk, chunkIdx);
            results.push(result);
            setAnalysisResults([...results]);
            
            // Small delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
            addToLog(`❌ Fehler bei Abschnitt ${chunkIdx + 1}: ${errorMsg}`);
            
            // Continue with next chunk instead of stopping
            continue;
          }
        }
      }

      if (!isPaused && isAnalyzing) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        addToLog(`🎉 ANALYSE ABGESCHLOSSEN in ${duration}s!`);
        addToLog(`📈 ${results.length} Bewertungen erstellt`);
        addToLog(`💰 Gesamt-Token: ${tokenUsage.prompt + tokenUsage.completion}`);
        
        onAnalysisComplete(results);
        toast({
          title: "Analyse abgeschlossen",
          description: `${results.length} Bewertungen in ${Math.round(duration/60)} Minuten erstellt.`,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      addToLog(`💥 KRITISCHER FEHLER: ${errorMsg}`);
      toast({
        title: "Analyse-Fehler",
        description: errorMsg,
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
    setApiCallCount(0);
    setTokenUsage({ prompt: 0, completion: 0 });
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <div className="text-2xl font-bold text-blue-600">{apiCallCount}</div>
              <div className="text-sm text-slate-600">API-Aufrufe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tokenUsage.prompt + tokenUsage.completion}</div>
              <div className="text-sm text-slate-600">Token verbraucht</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      {currentStatus && (
        <Alert className="bg-blue-50 border-blue-200">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Status:</strong> {currentStatus}
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
                <span>Fortschritt ({currentStep}/{totalSteps})</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {isAnalyzing && currentArchetypeIndex < archetypes.length && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="bg-blue-100">
                    Aktuell: {archetypes[currentArchetypeIndex]?.name}
                  </Badge>
                  <span className="text-sm text-slate-600">
                    Abschnitt {currentChunkIndex + 1} von {textChunks.length}
                  </span>
                </div>
                {textChunks[currentChunkIndex] && (
                  <div className="text-sm text-slate-600">
                    Aktueller Text: "{textChunks[currentChunkIndex].substring(0, 120)}..."
                  </div>
                )}
              </div>
            )}

            {/* Live Results Preview */}
            {analysisResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Neueste Bewertungen:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {analysisResults.slice(-5).reverse().map((result, idx) => {
                    const archetype = archetypes.find(a => a.id === result.archetypeId);
                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded text-sm border-l-4 border-blue-400">
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant="secondary">{archetype?.name}</Badge>
                          <div className="flex gap-2">
                            <span className="font-medium">{result.overallRating.toFixed(1)}/5 ⭐</span>
                            <span className="text-xs text-slate-500">
                              {result.expectedReviewSentiment === 'positive' ? '😊' : 
                               result.expectedReviewSentiment === 'negative' ? '😞' : '😐'}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600">{result.feedback.substring(0, 120)}...</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed Log */}
            {detailedLog.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Live-Log:</h4>
                <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-40 overflow-y-auto">
                  {detailedLog.slice(-15).map((log, idx) => (
                    <div key={idx} className="leading-tight">{log}</div>
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
          <Button 
            onClick={startAnalysis} 
            size="lg" 
            className="bg-green-600 hover:bg-green-700"
            disabled={textChunks.length === 0}
          >
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

      {textChunks.length === 0 && pdfContent && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Der hochgeladene Text ist zu kurz für eine Analyse. Bitte laden Sie eine längere Datei hoch.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
