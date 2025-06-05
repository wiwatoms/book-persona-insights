
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface AnalysisStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
}

interface AnalysisProgressProps {
  steps: AnalysisStep[];
  currentStep: number;
  totalSteps: number;
  isBackgroundJob?: boolean;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  steps,
  currentStep,
  totalSteps,
  isBackgroundJob = false
}) => {
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const runningStepProgress = steps.find(step => step.status === 'running')?.progress || 0;
    
    const progress = ((completedSteps * 100) + runningStepProgress) / totalSteps;
    setOverallProgress(Math.min(progress, 100));
  }, [steps, totalSteps]);

  const getStatusIcon = (status: AnalysisStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: AnalysisStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'running':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Analyse-Fortschritt
          {isBackgroundJob && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Hintergrund
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Gesamt-Fortschritt</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="w-full" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              {getStatusIcon(step.status)}
              <div className="flex-1">
                <div className={`text-sm font-medium ${getStatusColor(step.status)}`}>
                  {step.name}
                </div>
                {step.status === 'running' && (
                  <Progress value={step.progress} className="w-full mt-1 h-1" />
                )}
              </div>
              <div className="text-xs text-gray-500">
                {step.status === 'completed' && '✓'}
                {step.status === 'running' && `${step.progress}%`}
                {step.status === 'failed' && '✗'}
              </div>
            </div>
          ))}
        </div>

        {isBackgroundJob && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Die Analyse läuft im Hintergrund weiter. Sie können diese Seite verlassen und später zurückkehren.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
