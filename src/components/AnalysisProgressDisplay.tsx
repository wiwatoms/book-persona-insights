
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Clock, Zap, TrendingUp, FileText } from 'lucide-react';
import { AnalysisProgress } from './AnalysisEngine';
import { ReaderArchetype, AnalysisResult } from './BookAnalyzer';

interface AnalysisProgressDisplayProps {
  progress: AnalysisProgress;
  archetypes: ReaderArchetype[];
}

export const AnalysisProgressDisplay: React.FC<AnalysisProgressDisplayProps> = ({
  progress,
  archetypes
}) => {
  const progressPercentage = progress.totalSteps > 0 ? (progress.currentStep / progress.totalSteps) * 100 : 0;
  
  return (
    <div className="space-y-6">
      {/* Status Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Status:</strong> {progress.status}
        </AlertDescription>
      </Alert>

      {/* Chunking Summary */}
      {progress.chunkingSummary && (
        <Alert className="bg-green-50 border-green-200">
          <FileText className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Text-Aufteilung:</strong> {progress.chunkingSummary}
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Analyse-Fortschritt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{archetypes.length}</div>
              <div className="text-sm text-slate-600">Archetypen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.totalChunks}</div>
              <div className="text-sm text-slate-600">Text-Abschnitte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.totalSteps}</div>
              <div className="text-sm text-slate-600">Gesamt-Analysen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.apiCalls}</div>
              <div className="text-sm text-slate-600">API-Aufrufe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progress.tokenUsage.prompt + progress.tokenUsage.completion}
              </div>
              <div className="text-sm text-slate-600">Token verbraucht</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fortschritt</span>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              {Math.round(progressPercentage)}% abgeschlossen
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Schritt {progress.currentStep} von {progress.totalSteps}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Current Analysis Info */}
          {progress.currentArchetype && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-blue-100">
                  Aktuell: {progress.currentArchetype}
                </Badge>
                <span className="text-sm text-slate-600">
                  Abschnitt {progress.currentChunk} von {progress.totalChunks}
                </span>
              </div>
            </div>
          )}

          {/* Recent Results with 1-10 scale display */}
          {progress.results.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Neueste Bewertungen (1-10 Skala):
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {progress.results.slice(-5).reverse().map((result, idx) => {
                  const archetype = archetypes.find(a => a.id === result.archetypeId);
                  const ratingColor = result.overallRating >= 7 ? 'text-green-600' : 
                                    result.overallRating >= 5 ? 'text-yellow-600' : 'text-red-600';
                  
                  return (
                    <div key={idx} className="bg-slate-50 p-3 rounded text-sm border-l-4 border-blue-400">
                      <div className="flex justify-between items-center mb-1">
                        <Badge variant="secondary">{archetype?.name}</Badge>
                        <div className="flex gap-2 items-center">
                          <span className={`font-medium ${ratingColor}`}>
                            {result.overallRating.toFixed(1)}/10
                          </span>
                          <span className="text-xs text-slate-500">
                            {result.expectedReviewSentiment === 'positive' ? '😊' : 
                             result.expectedReviewSentiment === 'negative' ? '😞' : '😐'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mb-1">
                        Engagement: {result.ratings.engagement}/10 • 
                        Stil: {result.ratings.style}/10 • 
                        Kaufwahrscheinlichkeit: {Math.round(result.buyingProbability * 100)}%
                      </div>
                      <p className="text-slate-600">{result.feedback.substring(0, 120)}...</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
