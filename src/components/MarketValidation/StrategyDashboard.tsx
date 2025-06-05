
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Image, 
  FileText, 
  Users, 
  TrendingUp, 
  Target,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ReaderPersona } from '../BookAnalyzer';
import { useBookContext } from './BookContextProvider';
import { AIProcessor } from './AIProcessor';

interface StrategyDecision {
  type: 'title' | 'cover' | 'blurb' | 'personas' | 'marketing';
  value: string;
  confidence: number;
  reasoning: string;
  locked: boolean;
}

interface CohesionCheck {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  personaAlignment: number;
}

interface StrategyDashboardProps {
  personas: ReaderPersona[];
  selectedTitle?: string;
  selectedCover?: string;
  selectedBlurb?: string;
  marketingStrategy?: any;
  abTestResults?: any[];
  onExportStrategy: () => void;
  onGoToModule: (moduleId: string) => void;
}

export const StrategyDashboard: React.FC<StrategyDashboardProps> = ({
  personas,
  selectedTitle,
  selectedCover,
  selectedBlurb,
  marketingStrategy,
  abTestResults,
  onExportStrategy,
  onGoToModule
}) => {
  const { bookContent } = useBookContext();
  const [decisions, setDecisions] = useState<StrategyDecision[]>([]);
  const [cohesionCheck, setCohesionCheck] = useState<CohesionCheck | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runCohesionCheck = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `
As an AI publishing consultant, analyze the cohesion and effectiveness of this book's marketing strategy:

BOOK CONTENT: ${bookContent.substring(0, 2000)}

MARKETING STRATEGY ELEMENTS:
- Title: ${selectedTitle || 'Not selected'}
- Cover: ${selectedCover || 'Not selected'}  
- Blurb: ${selectedBlurb || 'Not selected'}
- Target Personas: ${personas.map(p => p.name).join(', ')}
- Marketing Angles: ${marketingStrategy?.angles?.length || 0} angles defined

Evaluate:
1. Overall cohesion score (1-100)
2. How well elements work together
3. Alignment with target personas
4. Strengths of the current strategy
5. Weaknesses or gaps
6. Specific recommendations for improvement

Format as JSON:
{
  "overallScore": number,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["rec1", "rec2"],
  "personaAlignment": number
}
      `;

      const result = await AIProcessor.processRequest(prompt);
      const check: CohesionCheck = JSON.parse(result);
      setCohesionCheck(check);
    } catch (error) {
      console.error('Cohesion check failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCompletionStatus = () => {
    const completed = [
      selectedTitle ? 'title' : null,
      selectedCover ? 'cover' : null,
      selectedBlurb ? 'blurb' : null,
      personas.length > 0 ? 'personas' : null,
      marketingStrategy ? 'marketing' : null
    ].filter(Boolean);

    return {
      completed: completed.length,
      total: 5,
      percentage: (completed.length / 5) * 100
    };
  };

  const status = getCompletionStatus();

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategy Completion Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{status.completed}/{status.total} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${status.percentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                selectedTitle ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium">Title</div>
              <div className="text-xs text-gray-600">
                {selectedTitle ? 'Selected' : 'Pending'}
              </div>
            </div>

            <div className="text-center">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                selectedCover ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Image className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium">Cover</div>
              <div className="text-xs text-gray-600">
                {selectedCover ? 'Selected' : 'Pending'}
              </div>
            </div>

            <div className="text-center">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                selectedBlurb ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium">Blurb</div>
              <div className="text-xs text-gray-600">
                {selectedBlurb ? 'Selected' : 'Pending'}
              </div>
            </div>

            <div className="text-center">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                personas.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Users className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium">Personas</div>
              <div className="text-xs text-gray-600">
                {personas.length} defined
              </div>
            </div>

            <div className="text-center">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                marketingStrategy ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium">Marketing</div>
              <div className="text-xs text-gray-600">
                {marketingStrategy ? 'Generated' : 'Pending'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Summary */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Strategy Summary</TabsTrigger>
          <TabsTrigger value="cohesion">Cohesion Analysis</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600">Title</div>
                  <div className="font-medium">
                    {selectedTitle || <span className="text-gray-400">Not selected</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Cover</div>
                  <div className="font-medium">
                    {selectedCover || <span className="text-gray-400">Not selected</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Blurb</div>
                  <div className="text-sm">
                    {selectedBlurb ? (
                      selectedBlurb.length > 100 
                        ? `${selectedBlurb.substring(0, 100)}...`
                        : selectedBlurb
                    ) : (
                      <span className="text-gray-400">Not selected</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Target Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {personas.map((persona) => (
                    <div key={persona.id} className="flex items-center justify-between">
                      <span className="font-medium">{persona.name}</span>
                      <Badge variant="outline">{persona.demographics}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {marketingStrategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Marketing Strategy Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">Marketing Angles</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {marketingStrategy.angles?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">Marketing Channels</div>
                    <div className="text-2xl font-bold text-green-600">
                      {marketingStrategy.channels?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">Campaign Ideas</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {marketingStrategy.campaignIdeas?.length || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cohesion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Strategy Cohesion Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runCohesionCheck} 
                disabled={isAnalyzing || status.completed < 3}
                className="w-full"
              >
                {isAnalyzing ? 'Analyzing...' : 'Run Cohesion Check'}
              </Button>

              {status.completed < 3 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Complete at least title, cover, and blurb selection to run cohesion analysis.
                  </AlertDescription>
                </Alert>
              )}

              {cohesionCheck && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${
                      cohesionCheck.overallScore >= 80 ? 'text-green-600' :
                      cohesionCheck.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {cohesionCheck.overallScore}%
                    </div>
                    <div className="text-gray-600">Overall Cohesion Score</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {cohesionCheck.strengths.map((strength, index) => (
                          <li key={index} className="text-sm">• {strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Areas to Improve</h4>
                      <ul className="space-y-1">
                        {cohesionCheck.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm">• {weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {cohesionCheck.recommendations.map((rec, index) => (
                        <li key={index} className="p-3 bg-blue-50 rounded-md text-sm">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Refine Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onGoToModule('titles')}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refine Title Options
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onGoToModule('covers')}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Test New Cover Concepts
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onGoToModule('blurbs')}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Optimize Blurb Copy
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export & Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start"
                  onClick={onExportStrategy}
                  disabled={status.completed < 4}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Complete Strategy
                </Button>
                <div className="text-xs text-gray-600">
                  {status.completed < 4 && "Complete more sections to export"}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
