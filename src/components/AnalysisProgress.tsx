
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReaderArchetype, AnalysisResult } from './BookAnalyzer';
import { AIAnalysisService, AIConfig } from './AIAnalysisService';
import { BackgroundJobManager } from '../utils/backgroundProcessing';
import { AnalysisProgressDisplay } from './AnalysisProgressDisplay';
import { AdvancedArchetypeManager } from './AdvancedArchetypeManager';
import { AdvancedPromptEditor } from './AdvancedPromptEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RotateCcw, AlertCircle, Settings, Users, Code } from 'lucide-react';
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
  archetypes: initialArchetypes,
  onAnalysisComplete,
  isAnalyzing,
  setIsAnalyzing
}) => {
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null);
  const [archetypes, setArchetypes] = useState<ReaderArchetype[]>(initialArchetypes);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [backgroundJob, setBackgroundJob] = useState<any>(null);
  const [customPrompts, setCustomPrompts] = useState<any[]>([]);
  const { toast } = useToast();

  // Background job manager
  const jobManager = BackgroundJobManager.getInstance();

  useEffect(() => {
    // Load existing jobs on component mount
    jobManager.loadJobsFromStorage();
    
    // Check for existing config
    const savedApiKey = localStorage.getItem('openai_api_key');
    const savedModel = localStorage.getItem('openai_model');
    if (savedApiKey && savedModel) {
      setAIConfig({ apiKey: savedApiKey, model: savedModel });
    }

    // Poll for job updates
    const pollInterval = setInterval(() => {
      if (currentJobId) {
        const job = jobManager.getJob(currentJobId);
        if (job) {
          setBackgroundJob(job);
          
          if (job.status === 'complete') {
            setIsAnalyzing(false);
            onAnalysisComplete(job.results || []);
            setCurrentJobId(null);
            toast({
              title: "Analyse abgeschlossen",
              description: `${job.results?.length || 0} Bewertungen erstellt`,
            });
          } else if (job.status === 'failed') {
            setIsAnalyzing(false);
            setCurrentJobId(null);
            toast({
              title: "Analyse-Fehler",
              description: job.error || 'Unbekannter Fehler',
              variant: "destructive",
            });
          }
        }
      }
    }, 1000);
    
    return () => clearInterval(pollInterval);
  }, [currentJobId]);

  useEffect(() => {
    // Update archetypes when initialArchetypes changes
    setArchetypes(initialArchetypes);
  }, [initialArchetypes]);

  const validateInputs = (): string | null => {
    if (!aiConfig) return 'AI-Konfiguration fehlt';
    if (!pdfContent || pdfContent.length < 100) return 'Text ist zu kurz (mindestens 100 Zeichen erforderlich)';
    if (archetypes.length === 0) return 'Keine Archetypen ausgewählt';
    return null;
  };

  const startAnalysis = async () => {
    const error = validateInputs();
    if (error) {
      toast({
        title: "Validierungsfehler",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Create a background job
    const jobId = jobManager.createJob('analysis', {
      pdfContent,
      archetypes,
      aiConfig: aiConfig!,
      prompts: customPrompts.length > 0 ? customPrompts : undefined
    });
    
    setCurrentJobId(jobId);
    
    toast({
      title: "Analyse gestartet",
      description: "Die Analyse läuft im Hintergrund und wird auch fortgesetzt, wenn Sie das Browser-Fenster schließen.",
    });
  };

  const stopAnalysis = () => {
    if (currentJobId) {
      const job = jobManager.getJob(currentJobId);
      if (job) {
        jobManager.updateJobStatus(currentJobId, 'failed', undefined, 'Vom Benutzer abgebrochen');
      }
    }
    
    setIsAnalyzing(false);
    setCurrentJobId(null);
    
    toast({
      title: "Analyse gestoppt",
      description: "Die Analyse wurde vom Benutzer abgebrochen",
    });
  };

  const resetAnalysis = () => {
    stopAnalysis();
    setBackgroundJob(null);
    
    toast({
      title: "Analyse zurückgesetzt",
      description: "Bereit für eine neue Analyse",
    });
  };

  const handleArchetypesUpdated = (newArchetypes: ReaderArchetype[]) => {
    setArchetypes(newArchetypes);
  };

  const handlePromptsUpdated = (newPrompts: any[]) => {
    setCustomPrompts(newPrompts);
  };

  // Show AI config if not configured
  if (!aiConfig) {
    return <AIAnalysisService onConfigured={setAIConfig} />;
  }

  const inputError = validateInputs();
  const progressData = backgroundJob?.progress ? {
    currentStep: Math.round((backgroundJob.progress / 100) * (archetypes.length * 10)), // Approximate
    totalSteps: archetypes.length * 10, // Approximate
    currentArchetype: backgroundJob.data?.archetypes[0]?.name || '',
    currentChunk: 1,
    totalChunks: 10, // Approximate
    status: backgroundJob.status === 'running' 
      ? `Analyse läuft: ${backgroundJob.progress.toFixed(0)}% abgeschlossen` 
      : `${backgroundJob.status}`,
    results: backgroundJob.results || [],
    apiCalls: backgroundJob.results?.length || 0,
    tokenUsage: { prompt: 0, completion: 0 } // Not tracked in background job
  } : null;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Analyse-Status
          </TabsTrigger>
          <TabsTrigger value="archetypes" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Erweiterte Archetypen
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Prompt-Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          {/* Input Validation Error */}
          {inputError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{inputError}</AlertDescription>
            </Alert>
          )}

          {/* Progress Display */}
          {backgroundJob && progressData && (
            <AnalysisProgressDisplay 
              progress={progressData} 
              archetypes={archetypes}
            />
          )}

          {/* Control Buttons */}
          <div className="flex justify-center gap-4">
            {!isAnalyzing && !backgroundJob && (
              <Button 
                onClick={startAnalysis} 
                size="lg" 
                className="bg-green-600 hover:bg-green-700"
                disabled={!!inputError}
              >
                <Play className="w-5 h-5 mr-2" />
                Analyse starten
              </Button>
            )}

            {isAnalyzing && (
              <Button onClick={stopAnalysis} size="lg" variant="outline">
                <Pause className="w-5 h-5 mr-2" />
                Stoppen
              </Button>
            )}

            {(backgroundJob || !isAnalyzing) && (
              <Button onClick={resetAnalysis} size="lg" variant="outline">
                <RotateCcw className="w-5 h-5 mr-2" />
                Zurücksetzen
              </Button>
            )}
          </div>

          {/* Analysis Info */}
          {!backgroundJob && !inputError && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-lg font-medium text-blue-800">
                    Bereit für Analyse
                  </div>
                  <div className="text-sm text-blue-600">
                    {archetypes.length} Archetypen × {Math.ceil(pdfContent.split(/\s+/).length / 400)} Abschnitte = {archetypes.length * Math.ceil(pdfContent.split(/\s+/).length / 400)} Analysen
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="archetypes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Archetypen konfigurieren
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedArchetypeManager
                onArchetypesReady={handleArchetypesUpdated}
                textPreview={pdfContent.substring(0, 500) + '...'}
                initialArchetypes={archetypes}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <AdvancedPromptEditor onPromptsChanged={handlePromptsUpdated} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
