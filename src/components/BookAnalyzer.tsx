
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PdfUploader } from './PdfUploader';
import { ArchetypeManager } from './ArchetypeManager';
import { AnalysisProgress } from './AnalysisProgress';
import { ResultsDashboard } from './ResultsDashboard';
import { FileText, Users, TrendingUp, BarChart3 } from 'lucide-react';

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

export const BookAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [pdfContent, setPdfContent] = useState<string>('');
  const [archetypes, setArchetypes] = useState<ReaderArchetype[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handlePdfUploaded = (content: string) => {
    setPdfContent(content);
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

  return (
    <div className="max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm border border-slate-200">
          <TabsTrigger 
            value="upload" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4" />
            PDF Upload
          </TabsTrigger>
          <TabsTrigger 
            value="archetypes"
            disabled={!pdfContent}
            className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4" />
            Leser-Archetypen
          </TabsTrigger>
          <TabsTrigger 
            value="analysis"
            disabled={archetypes.length === 0}
            className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4" />
            Analyse
          </TabsTrigger>
          <TabsTrigger 
            value="results"
            disabled={analysisResults.length === 0}
            className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4" />
            Ergebnisse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-800">Buchmanuskript hochladen</CardTitle>
            </CardHeader>
            <CardContent>
              <PdfUploader onPdfUploaded={handlePdfUploaded} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archetypes" className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-800">Leser-Archetypen konfigurieren</CardTitle>
            </CardHeader>
            <CardContent>
              <ArchetypeManager 
                onArchetypesReady={handleArchetypesReady}
                textPreview={pdfContent.substring(0, 500) + '...'}
              />
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
                pdfContent={pdfContent}
                archetypes={archetypes}
                onAnalysisComplete={handleAnalysisComplete}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <ResultsDashboard 
            results={analysisResults}
            archetypes={archetypes}
            textLength={pdfContent.length}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
