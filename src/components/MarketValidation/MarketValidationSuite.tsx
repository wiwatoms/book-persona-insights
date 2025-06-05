
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookContextProvider } from './BookContextProvider';
import { LiteraryLandscapeModule } from './LiteraryLandscapeModule';
import { TargetAudienceModule } from './TargetAudienceModule';
import { AIConfig } from '../AIAnalysisService';
import { MarketPosition, TrendAnalysis, ReaderPersona } from './types';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface MarketValidationSuiteProps {
  bookContent: string;
  aiConfig: AIConfig;
}

type ValidationStep = 'landscape' | 'audience' | 'feedback' | 'strategy';

const STEP_LABELS = {
  landscape: 'Marktanalyse',
  audience: 'Zielgruppen',
  feedback: 'Feedback-Simulation',
  strategy: 'Marketing-Strategie'
};

export const MarketValidationSuite: React.FC<MarketValidationSuiteProps> = ({
  bookContent,
  aiConfig
}) => {
  const [currentStep, setCurrentStep] = useState<ValidationStep>('landscape');
  const [marketPosition, setMarketPosition] = useState<MarketPosition | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [selectedPersonas, setSelectedPersonas] = useState<ReaderPersona[]>([]);

  const stepProgress = {
    landscape: 25,
    audience: 50,
    feedback: 75,
    strategy: 100
  };

  const handleLandscapeComplete = (position: MarketPosition, trends: TrendAnalysis) => {
    setMarketPosition(position);
    setTrendAnalysis(trends);
    setCurrentStep('audience');
  };

  const handlePersonasReady = (personas: ReaderPersona[]) => {
    setSelectedPersonas(personas);
    setCurrentStep('feedback');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'landscape':
        return (
          <LiteraryLandscapeModule
            aiConfig={aiConfig}
            onAnalysisComplete={handleLandscapeComplete}
          />
        );
      case 'audience':
        return marketPosition ? (
          <TargetAudienceModule
            aiConfig={aiConfig}
            marketPosition={marketPosition}
            onPersonasReady={handlePersonasReady}
          />
        ) : null;
      case 'feedback':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Focus Group Feedback Simulation</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Diese Module werden in Phase 2 implementiert...</p>
              <div className="space-y-2 mt-4">
                <p>Verfügbare Personas: {selectedPersonas.map(p => p.name).join(', ')}</p>
                <p>Marktposition: {marketPosition?.genre}</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'strategy':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Marketing Strategy Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Diese Module werden in Phase 4 implementiert...</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <BookContextProvider bookContent={bookContent}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Progress Header */}
        <Card>
          <CardHeader>
            <CardTitle>AI Market Validation & Launch Strategy Simulator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                {Object.entries(STEP_LABELS).map(([step, label]) => (
                  <span
                    key={step}
                    className={`font-medium ${
                      currentStep === step ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <Progress value={stepProgress[currentStep]} className="h-2" />
              <p className="text-sm text-gray-600">
                Aktueller Schritt: {STEP_LABELS[currentStep]}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        {renderCurrentStep()}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const steps: ValidationStep[] = ['landscape', 'audience', 'feedback', 'strategy'];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex > 0) {
                setCurrentStep(steps[currentIndex - 1]);
              }
            }}
            disabled={currentStep === 'landscape'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>

          {currentStep !== 'strategy' && (
            <Button
              onClick={() => {
                const steps: ValidationStep[] = ['landscape', 'audience', 'feedback', 'strategy'];
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1]);
                }
              }}
              disabled={
                (currentStep === 'landscape' && !marketPosition) ||
                (currentStep === 'audience' && selectedPersonas.length === 0)
              }
            >
              Weiter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </BookContextProvider>
  );
};
