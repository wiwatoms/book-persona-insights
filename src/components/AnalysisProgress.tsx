
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReaderArchetype, AnalysisResult } from './BookAnalyzer';
import { AIAnalysisService, AIConfig } from './AIAnalysisService';
import { AnalysisController, AnalysisProgress as AnalysisProgressType } from './AnalysisEngine';
import { AnalysisProgressDisplay } from './AnalysisProgressDisplay';
import { Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
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
  const [progress, setProgress] = useState<AnalysisProgressType | null>(null);
  const [analysisController] = useState(() => new AnalysisController());
  const { toast } = useToast();

  // Check for existing config on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    const savedModel = localStorage.getItem('openai_model');
    if (savedApiKey && savedModel) {
      setAIConfig({ apiKey: savedApiKey, model: savedModel });
    }
  }, []);

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
    setProgress(null);
    
    try {
      const results = await analysisController.runAnalysis(
        pdfContent,
        archetypes,
        aiConfig!,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );
      
      if (results.length > 0) {
        onAnalysisComplete(results);
        toast({
          title: "Analyse abgeschlossen",
          description: `${results.length} Bewertungen erstellt`,
        });
      } else {
        toast({
          title: "Keine Ergebnisse",
          description: "Die Analyse konnte keine Ergebnisse generieren",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast({
        title: "Analyse-Fehler",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stopAnalysis = () => {
    analysisController.stop();
    setIsAnalyzing(false);
    toast({
      title: "Analyse gestoppt",
      description: "Die Analyse wurde vom Benutzer abgebrochen",
    });
  };

  const resetAnalysis = () => {
    analysisController.stop();
    setIsAnalyzing(false);
    setProgress(null);
    toast({
      title: "Analyse zurückgesetzt",
      description: "Bereit für eine neue Analyse",
    });
  };

  // Show AI config if not configured
  if (!aiConfig) {
    return <AIAnalysisService onConfigured={setAIConfig} />;
  }

  const inputError = validateInputs();

  return (
    <div className="space-y-6">
      {/* Input Validation Error */}
      {inputError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{inputError}</AlertDescription>
        </Alert>
      )}

      {/* Progress Display */}
      {progress && (
        <AnalysisProgressDisplay 
          progress={progress} 
          archetypes={archetypes}
        />
      )}

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        {!isAnalyzing && !progress && (
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

        {(progress || !isAnalyzing) && (
          <Button onClick={resetAnalysis} size="lg" variant="outline">
            <RotateCcw className="w-5 h-5 mr-2" />
            Zurücksetzen
          </Button>
        )}
      </div>

      {/* Analysis Info */}
      {!progress && !inputError && (
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
    </div>
  );
};
