import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookContextProvider } from './BookContextProvider';
import { LiteraryLandscapeModule } from './LiteraryLandscapeModule';
import { TargetAudienceModule } from './TargetAudienceModule';
import { TitleFeedbackModule } from './TitleFeedbackModule';
import { CoverFeedbackModule } from './CoverFeedbackModule';
import { BlurbFeedbackModule } from './BlurbFeedbackModule';
import { ABTestingModule } from './ABTestingModule';
import { MarketingStrategyModule } from './MarketingStrategyModule';
import { StrategyDashboard } from './StrategyDashboard';
import { ReaderPersona, MarketPosition, TrendAnalysis } from './types';
import { CheckCircle, Circle, BookOpen, Users, MessageSquare, Target, TrendingUp, BarChart3 } from 'lucide-react';

interface MarketValidationSuiteProps {
  bookContent: string;
}

export const MarketValidationSuite: React.FC<MarketValidationSuiteProps> = ({ bookContent }) => {
  const [activePhase, setActivePhase] = useState<string>('foundation');
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  
  // Phase 1 Data
  const [marketPosition, setMarketPosition] = useState<MarketPosition | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [personas, setPersonas] = useState<ReaderPersona[]>([]);
  
  // Phase 2 Data
  const [titleFeedback, setTitleFeedback] = useState<any[]>([]);
  const [coverFeedback, setCoverFeedback] = useState<any[]>([]);
  const [blurbFeedback, setBlurbFeedback] = useState<any[]>([]);
  
  // Phase 3 & 4 Data
  const [abTestResults, setAbTestResults] = useState<any[]>([]);
  const [marketingStrategy, setMarketingStrategy] = useState<any>(null);
  
  // Final selections
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [selectedCover, setSelectedCover] = useState<string>('');
  const [selectedBlurb, setSelectedBlurb] = useState<string>('');

  const markModuleComplete = (moduleId: string) => {
    setCompletedModules(prev => new Set([...prev, moduleId]));
  };

  const phases = [
    {
      id: 'foundation',
      name: 'Foundation & Audience',
      icon: BookOpen,
      description: 'Market positioning and reader personas',
      modules: ['landscape', 'audience']
    },
    {
      id: 'feedback',
      name: 'Focus Group Feedback',
      icon: MessageSquare,
      description: 'Simulated feedback on titles, covers, and blurbs',
      modules: ['titles', 'covers', 'blurbs']
    },
    {
      id: 'testing',
      name: 'A/B Testing & Validation',
      icon: Target,
      description: 'Concept testing and optimization',
      modules: ['abtest']
    },
    {
      id: 'strategy',
      name: 'Marketing Strategy',
      icon: TrendingUp,
      description: 'Launch strategy and channel recommendations',
      modules: ['marketing']
    },
    {
      id: 'dashboard',
      name: 'Strategy Dashboard',
      icon: BarChart3,
      description: 'Review and export your complete strategy',
      modules: ['dashboard']
    }
  ];

  const canAccessPhase = (phaseId: string) => {
    switch (phaseId) {
      case 'foundation':
        return true;
      case 'feedback':
        return completedModules.has('landscape') && completedModules.has('audience');
      case 'testing':
        return completedModules.has('titles') && completedModules.has('covers') && completedModules.has('blurbs');
      case 'strategy':
        return completedModules.has('titles') && completedModules.has('audience');
      case 'dashboard':
        return completedModules.has('audience') && (completedModules.has('titles') || completedModules.has('covers') || completedModules.has('blurbs'));
      default:
        return false;
    }
  };

  const handleExportStrategy = () => {
    const strategy = {
      bookTitle: selectedTitle,
      coverConcept: selectedCover,
      blurb: selectedBlurb,
      targetPersonas: personas,
      marketPosition,
      marketingStrategy,
      abTestResults,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(strategy, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'book-marketing-strategy.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGoToModule = (moduleId: string) => {
    // Navigate to the appropriate phase based on module
    if (['titles', 'covers', 'blurbs'].includes(moduleId)) {
      setActivePhase('feedback');
    } else if (moduleId === 'abtest') {
      setActivePhase('testing');
    } else if (moduleId === 'marketing') {
      setActivePhase('strategy');
    }
  };

  return (
    <BookContextProvider bookContent={bookContent}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">AI Market Validation & Launch Strategy Simulator</CardTitle>
            <p className="text-gray-600">
              Simulate comprehensive market research and focus group feedback for your book
            </p>
          </CardHeader>
        </Card>

        {/* Phase Navigation */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {phases.map((phase) => {
                const Icon = phase.icon;
                const isAccessible = canAccessPhase(phase.id);
                const isActive = activePhase === phase.id;
                const isComplete = phase.modules.every(mod => completedModules.has(mod));
                
                return (
                  <Button
                    key={phase.id}
                    variant={isActive ? "default" : "outline"}
                    className={`h-auto p-4 flex flex-col items-start text-left ${
                      !isAccessible ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => isAccessible && setActivePhase(phase.id)}
                    disabled={!isAccessible}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{phase.name}</span>
                      {isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <p className="text-sm opacity-75">{phase.description}</p>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Phase Content */}
        <div className="space-y-6">
          {activePhase === 'foundation' && (
            <Tabs defaultValue="landscape" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="landscape" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Literary Landscape
                  {completedModules.has('landscape') && <CheckCircle className="w-4 h-4 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="audience" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Target Audience
                  {completedModules.has('audience') && <CheckCircle className="w-4 h-4 text-green-500" />}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="landscape">
                <LiteraryLandscapeModule
                  onComplete={(position, trends) => {
                    setMarketPosition(position);
                    setTrendAnalysis(trends);
                    markModuleComplete('landscape');
                  }}
                />
              </TabsContent>

              <TabsContent value="audience">
                <TargetAudienceModule
                  marketPosition={marketPosition}
                  onComplete={(generatedPersonas) => {
                    setPersonas(generatedPersonas);
                    markModuleComplete('audience');
                  }}
                />
              </TabsContent>
            </Tabs>
          )}

          {activePhase === 'feedback' && (
            <Tabs defaultValue="titles" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="titles" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Titles
                  {completedModules.has('titles') && <CheckCircle className="w-4 h-4 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="covers" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Covers
                  {completedModules.has('covers') && <CheckCircle className="w-4 h-4 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="blurbs" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Blurbs
                  {completedModules.has('blurbs') && <CheckCircle className="w-4 h-4 text-green-500" />}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="titles">
                <TitleFeedbackModule
                  personas={personas}
                  onComplete={(feedback) => {
                    setTitleFeedback(feedback);
                    markModuleComplete('titles');
                  }}
                />
              </TabsContent>

              <TabsContent value="covers">
                <CoverFeedbackModule
                  personas={personas}
                  onComplete={(feedback) => {
                    setCoverFeedback(feedback);
                    markModuleComplete('covers');
                  }}
                />
              </TabsContent>

              <TabsContent value="blurbs">
                <BlurbFeedbackModule
                  personas={personas}
                  onComplete={(feedback) => {
                    setBlurbFeedback(feedback);
                    markModuleComplete('blurbs');
                  }}
                />
              </TabsContent>
            </Tabs>
          )}

          {activePhase === 'testing' && (
            <ABTestingModule
              personas={personas}
              titleOptions={titleFeedback.flatMap(f => f.titles || [])}
              coverOptions={coverFeedback.flatMap(f => f.covers || [])}
              blurbOptions={blurbFeedback.flatMap(f => f.blurbs || [])}
              onComplete={(results) => {
                setAbTestResults(results);
                markModuleComplete('abtest');
              }}
            />
          )}

          {activePhase === 'strategy' && (
            <MarketingStrategyModule
              personas={personas}
              selectedTitle={selectedTitle}
              selectedCover={selectedCover}
              selectedBlurb={selectedBlurb}
              onComplete={(strategy) => {
                setMarketingStrategy(strategy);
                markModuleComplete('marketing');
              }}
            />
          )}

          {activePhase === 'dashboard' && (
            <StrategyDashboard
              personas={personas}
              selectedTitle={selectedTitle}
              selectedCover={selectedCover}
              selectedBlurb={selectedBlurb}
              marketingStrategy={marketingStrategy}
              abTestResults={abTestResults}
              onExportStrategy={handleExportStrategy}
              onGoToModule={handleGoToModule}
            />
          )}
        </div>

        {/* Progress Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from(completedModules).map((module) => (
                <Badge key={module} variant="default">
                  {module} ✓
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {completedModules.size} of 8 modules completed
            </p>
          </CardContent>
        </Card>
      </div>
    </BookContextProvider>
  );
};
