
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from './FileUploader';
import { ArchetypeManager } from './ArchetypeManager';
import { AnalysisProgress } from './AnalysisProgress';
import { ResultsDashboard } from './ResultsDashboard';
import { AdvancedArchetypeManager } from './AdvancedArchetypeManager'; 
import { AdvancedPromptEditor } from './AdvancedPromptEditor';
import { FileText, Users, TrendingUp, BarChart3, Settings } from 'lucide-react';

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
    engagement: number; // 1-10 scale
    style: number; // 1-10 scale
    clarity: number; // 1-10 scale
    pacing: number; // 1-10 scale
    relevance: number; // 1-10 scale
  };
  overallRating: number; // 1-10 scale
  feedback: string;
  buyingProbability: number; // 0-1 scale
  recommendationLikelihood: number; // 0-1 scale
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
  attentionLevel: number; // 1-10
  personalResonance: number; // 1-10
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
  confidenceScore: number; // 1-10
}

export const BookAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [fileContent, setFileContent] = useState<string>('');
  const [archetypes, setArchetypes] = useState<ReaderArchetype[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [streamOfThoughtResults, setStreamOfThoughtResults] = useState<StreamOfThoughtResult[]>([]);
  const [analyticalInsights, setAnalyticalInsights] = useState<AnalyticalInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Mock analysis steps for AnalysisProgress component
  const mockAnalysisSteps = [
    { id: 'chunk', name: 'Text aufteilen', status: 'completed' as const, progress: 100 },
    { id: 'analyze', name: 'Analyse durchführen', status: 'running' as const, progress: 45 },
    { id: 'compile', name: 'Ergebnisse zusammenfassen', status: 'pending' as const, progress: 0 }
  ];

  const handleFileUploaded = (content: string) => {
    setFileContent(content);
    setActiveTab('archetypes');
  };

  const handleArchetypesReady = (archetypeList: ReaderArchetype[]) => {
    setArchetypes(archetypeList);
    setActiveTab('analysis');
  };

  const handleAnalysisComplete = (results: AnalysisResult[]) => {
    setAnalysisResults(results);
    setActiveTab('results');
  };

  const handleLayeredAnalysisComplete = (
    standardResults: AnalysisResult[], 
    sotResults: StreamOfThoughtResult[], 
    insights: AnalyticalInsight[]
  ) => {
    setAnalysisResults(standardResults);
    setStreamOfThoughtResults(sotResults);
    setAnalyticalInsights(insights);
    setActiveTab('results');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-5 bg-white/70 backdrop-blur-sm border border-slate-200">
          <TabsTrigger 
            value="upload" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Datei Upload</span>
            <span className="sm:hidden">Datei</span>
          </TabsTrigger>
          <TabsTrigger 
            value="archetypes"
            disabled={!fileContent}
            className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Leser-Archetypen</span>
            <span className="sm:hidden">Leser</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analysis"
            disabled={archetypes.length === 0}
            className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Analyse</span>
            <span className="sm:hidden">Analyse</span>
          </TabsTrigger>
          <TabsTrigger 
            value="results"
            disabled={analysisResults.length === 0}
            className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Ergebnisse</span>
            <span className="sm:hidden">Ergebnisse</span>
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="hidden md:flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Einstellungen</span>
            <span className="sm:hidden">Options</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-800">Manuskript hochladen</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader onFileUploaded={handleFileUploaded} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archetypes" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-800">Leser-Archetypen konfigurieren</CardTitle>
            </CardHeader>
            <CardContent>
              {advancedMode ? (
                <AdvancedArchetypeManager 
                  onArchetypesReady={handleArchetypesReady}
                  textPreview={fileContent.substring(0, 500) + '...'}
                />
              ) : (
                <ArchetypeManager 
                  onArchetypesReady={handleArchetypesReady}
                  textPreview={fileContent.substring(0, 500) + '...'}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-800">Analyse läuft...</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisProgress 
                steps={mockAnalysisSteps}
                currentStep={1}
                totalSteps={3}
                isBackgroundJob={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <ResultsDashboard 
            results={{ analysis: analysisResults.map(result => ({
              name: `Archetype ${result.archetypeId}`,
              Gesamtwertung: result.overallRating,
              Engagement: result.ratings.engagement,
              Stil: result.ratings.style,
              Klarheit: result.ratings.clarity,
              Tempo: result.ratings.pacing,
              Relevanz: result.ratings.relevance
            })) }}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-800">Erweiterte Einstellungen</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedPromptEditor onPromptsChanged={() => {}} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
