import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileUploader } from './FileUploader';
import { ArchetypeManager } from './ArchetypeManager';
import { AnalysisProgressDisplay } from './AnalysisProgressDisplay';
import { ResultsDashboard } from './ResultsDashboard';
import { TwoLayerResultsDashboard } from './TwoLayerResultsDashboard';
import { MarketValidationSuite } from './MarketValidation/MarketValidationSuite';
import { AIAnalysisService, AIConfig } from './AIAnalysisService';
import { AnalysisController, AnalysisProgress } from './AnalysisEngine';
import { TwoLayerAnalysisController, TwoLayerResult } from './TwoLayerAnalysisEngine';
import { AlertCircle, RotateCcw, BookOpen, TrendingUp, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { BackgroundJobManager } from '../utils/backgroundJobManager';

export interface ReaderArchetype {
  id: string;
  name: string;
  description: string;
  demographics: string;
  readingPreferences: string;
  personalityTraits: string[];
  motivations: string[];
  painPoints: string[];
}

export interface AnalysisResult {
  archetypeId: string;
  chunkIndex: number;
  ratings: {
    engagement: number;
    style: number;
    clarity: number;
    pacing: number;
    relevance: number;
  };
  overallRating: number;
  feedback: string;
  buyingProbability: number;
  recommendationLikelihood: number;
  expectedReviewSentiment: 'positive' | 'neutral' | 'negative';
  marketingInsights: string[];
}

export interface StreamOfThoughtResult {
  archetypeId: string;
  chunkIndex: number;
  rawThoughts: string;
  emotionalReactions: string[];
  immediateQuotes: string[];
  fragmentedInsights: string[];
  mood: 'excited' | 'bored' | 'confused' | 'engaged' | 'frustrated' | 'curious';
  attentionLevel: number;
  personalResonance: number;
}

export interface AnalyticalInsight {
  archetypeId: string;
  chunkIndex: number;
  keyTakeaways: string[];
  structuredFeedback: string;
  marketingOpportunities: string[];
  competitiveAdvantages: string[];
  riskFactors: string[];
  recommendedActions: string[];
  confidenceScore: number;
}

// Main component orchestrating the entire analysis process
export const BookAnalyzer = () => {
  type Step = 'config' | 'upload' | 'archetypes' | 'analyzing' | 'results';
  
  const [step, setStep] = useState<Step>('config');
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [textPreview, setTextPreview] = useState<string>('');
  const [archetypes, setArchetypes] = useState<ReaderArchetype[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [twoLayerResults, setTwoLayerResults] = useState<TwoLayerResult[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [useTwoLayerAnalysis, setUseTwoLayerAnalysis] = useState<boolean>(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  const [analysisController] = useState(() => new AnalysisController());
  const [twoLayerController] = useState(() => new TwoLayerAnalysisController());
  const [jobManager] = useState(() => BackgroundJobManager.getInstance());

  // Set up background job monitoring
  useEffect(() => {
    if (!currentJobId) return;

    const interval = setInterval(() => {
      const job = jobManager.getJob(currentJobId);
      if (job) {
        setAnalysisProgress({
          currentStep: job.completedSteps,
          totalSteps: job.totalSteps,
          currentArchetype: job.currentStep,
          currentChunk: job.completedSteps,
          totalChunks: job.totalSteps,
          status: job.currentStep,
          results: [],
          apiCalls: 0,
          tokenUsage: { prompt: 0, completion: 0 }
        });

        if (job.status === 'completed') {
          if (useTwoLayerAnalysis) {
            setTwoLayerResults(job.results);
          } else {
            setAnalysisResults(job.results);
          }
          setStep('results');
          setCurrentJobId(null);
          toast.success("Analyse erfolgreich abgeschlossen!");
        } else if (job.status === 'failed') {
          setAnalysisError(job.error || 'Unbekannter Fehler');
          setStep('archetypes');
          setCurrentJobId(null);
          toast.error("Analyse fehlgeschlagen", { description: job.error });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentJobId, useTwoLayerAnalysis, jobManager]);

  // Register job handlers
  useEffect(() => {
    jobManager.registerJobHandler('analysis', async (job, data) => {
      const { fileContent, archetypes, aiConfig, useTwoLayer } = data;
      
      if (useTwoLayer) {
        jobManager.updateJob(job.id, {
          totalSteps: archetypes.length * 10, // Estimate
          currentStep: 'Starte Zwei-Ebenen-Analyse...'
        });

        const results = [];
        for (let i = 0; i < archetypes.length; i++) {
          const archetype = archetypes[i];
          jobManager.updateJob(job.id, {
            currentStep: `Analysiere ${archetype.name}...`,
            completedSteps: i * 10
          });

          const archetypeResults = await twoLayerController.runTwoLayerAnalysis(
            fileContent,
            archetype,
            aiConfig,
            (progress) => {
              jobManager.updateJob(job.id, {
                currentStep: `${archetype.name}: ${progress.step}`,
                completedSteps: (i * 10) + progress.chunk
              });
            }
          );
          results.push(...archetypeResults);
        }
        
        jobManager.updateJob(job.id, { results, completedSteps: job.totalSteps });
      } else {
        const results = await analysisController.runAnalysis(
          fileContent,
          archetypes,
          aiConfig,
          (progress) => {
            jobManager.updateJob(job.id, {
              totalSteps: progress.totalSteps,
              currentStep: progress.status,
              completedSteps: progress.currentStep
            });
          }
        );
        
        jobManager.updateJob(job.id, { results });
      }
    });
  }, [jobManager, analysisController, twoLayerController]);

  const handleConfigured = (config: AIConfig) => {
    setAiConfig(config);
    setStep('upload');
    toast.success("AI Konfiguration gespeichert.");
  };

  const handleFileUploaded = (content: string) => {
    setFileContent(content);
    setTextPreview(content.substring(0, 700) + '...');
    setStep('archetypes');
    toast.success("Datei erfolgreich geladen.");
  };

  const handleArchetypesReady = (selectedArchetypes: ReaderArchetype[]) => {
    setArchetypes(selectedArchetypes);
    startAnalysis(selectedArchetypes);
  };

  const startAnalysis = async (selectedArchetypes: ReaderArchetype[]) => {
    if (!fileContent || !aiConfig) return;
    
    setAnalysisError(null);
    setAnalysisResults([]);
    setTwoLayerResults([]);
    setStep('analyzing');
    
    const analysisType = useTwoLayerAnalysis ? "Zwei-Ebenen-Analyse" : "Standard-Analyse";
    toast.info(`${analysisType} gestartet...`, {
      description: "Die Ergebnisse werden schrittweise angezeigt.",
    });

    try {
      const jobId = jobManager.createJob('analysis', {
        fileContent,
        archetypes: selectedArchetypes,
        aiConfig,
        useTwoLayer: useTwoLayerAnalysis
      });
      
      setCurrentJobId(jobId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.";
      console.error('Analysis failed:', error);
      setAnalysisError(errorMessage);
      toast.error("Analyse fehlgeschlagen", { description: errorMessage });
      setStep('archetypes');
    }
  };

  const handleStopAnalysis = () => {
    if (currentJobId) {
      jobManager.stopJob(currentJobId);
      setCurrentJobId(null);
    } else {
      if (useTwoLayerAnalysis) {
        twoLayerController.stop();
      } else {
        analysisController.stop();
      }
    }
    setStep('archetypes');
    toast.warning("Analyse wurde manuell gestoppt.");
  };
  
  const handleRestart = () => {
    setStep('upload');
    setFileContent('');
    setTextPreview('');
    setArchetypes([]);
    setAnalysisResults([]);
    setTwoLayerResults([]);
    setAnalysisProgress(null);
    setAnalysisError(null);
  };
  
  const aggregatedResults = useMemo(() => {
    if (analysisResults.length === 0) return [];

    return archetypes.map(archetype => {
      const archetypeResults = analysisResults.filter(r => r.archetypeId === archetype.id);
      if (archetypeResults.length === 0) return null;

      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      
      return {
        name: archetype.name,
        Gesamtwertung: avg(archetypeResults.map(r => r.overallRating)),
        Engagement: avg(archetypeResults.map(r => r.ratings.engagement)),
        Stil: avg(archetypeResults.map(r => r.ratings.style)),
        Klarheit: avg(archetypeResults.map(r => r.ratings.clarity)),
        Tempo: avg(archetypeResults.map(r => r.ratings.pacing)),
        Relevanz: avg(archetypeResults.map(r => r.ratings.relevance)),
      };
    }).filter(Boolean);
  }, [analysisResults, archetypes]);

  const renderStep = () => {
    switch (step) {
      case 'config':
        return (
          <Card>
            <CardHeader><CardTitle>1. AI Konfiguration</CardTitle></CardHeader>
            <CardContent><AIAnalysisService onConfigured={handleConfigured} /></CardContent>
          </Card>
        );
      case 'upload':
        return (
          <Card>
            <CardHeader><CardTitle>2. Manuskript hochladen</CardTitle></CardHeader>
            <CardContent><FileUploader onFileUploaded={handleFileUploaded} /></CardContent>
          </Card>
        );
      case 'archetypes':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>3. Analyse-Modus wählen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="analysis-mode"
                    checked={useTwoLayerAnalysis}
                    onCheckedChange={setUseTwoLayerAnalysis}
                  />
                  <Label htmlFor="analysis-mode" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Zwei-Ebenen-Analyse (Emotional + Analytisch)
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  {useTwoLayerAnalysis 
                    ? "Detaillierte Analyse mit emotionalen Reaktionen und analytischer Bewertung. Optimiert für Parallelverarbeitung."
                    : "Standard-Analyse mit Bewertungen und Feedback."
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>4. Leser-Archetypen bestätigen</CardTitle></CardHeader>
              <CardContent><ArchetypeManager onArchetypesReady={handleArchetypesReady} textPreview={textPreview} /></CardContent>
            </Card>
          </div>
        );
      case 'analyzing':
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                {useTwoLayerAnalysis ? "Optimierte Zwei-Ebenen-Analyse läuft..." : "Analyse läuft..."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisProgress && (
                <AnalysisProgressDisplay progress={analysisProgress} archetypes={archetypes} />
              )}
              <Button onClick={handleStopAnalysis} variant="destructive" className="mt-4">Analyse stoppen</Button>
            </CardContent>
          </Card>
        );
      case 'results':
        return (
          <Tabs defaultValue="analysis" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Reader Analysis
              </TabsTrigger>
              <TabsTrigger value="market" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Market Validation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {useTwoLayerAnalysis ? "Zwei-Ebenen-Analyse Ergebnisse" : "Reader Analysis Results"}
                    </CardTitle>
                    <Button onClick={handleRestart} variant="outline">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Neue Analyse
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {useTwoLayerAnalysis ? (
                    <TwoLayerResultsDashboard results={twoLayerResults} archetypes={archetypes} />
                  ) : (
                    <ResultsDashboard results={{ analysis: aggregatedResults as any }} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="market">
              <MarketValidationSuite bookContent={fileContent} />
            </TabsContent>
          </Tabs>
        );
      default:
        return <div>Invalid step</div>;
    }
  };

  return <div className="max-w-7xl mx-auto space-y-8">{renderStep()}</div>;
};
