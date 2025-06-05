import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, TrendingUp, Users } from 'lucide-react';
import { ReaderPersona } from './types';
import { useBookContext } from './BookContextProvider';
import { AIProcessor } from './AIProcessor';

interface ABTestResult {
  winner: 'A' | 'B';
  confidence: number;
  reasoning: string;
  metrics: {
    clickThroughRate: number;
    engagementScore: number;
    conversionProbability: number;
  };
  personaSpecificInsights: string[];
}

interface ABTestingModuleProps {
  personas: ReaderPersona[];
  titleOptions?: string[];
  coverOptions?: string[];
  blurbOptions?: string[];
  onComplete: (results: ABTestResult[]) => void;
}

export const ABTestingModule: React.FC<ABTestingModuleProps> = ({
  personas,
  titleOptions = [],
  coverOptions = [],
  blurbOptions = [],
  onComplete
}) => {
  const { content: bookContent } = useBookContext();
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [testType, setTestType] = useState<'title' | 'cover' | 'blurb'>('title');
  const [optionA, setOptionA] = useState<string>('');
  const [optionB, setOptionB] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ABTestResult[]>([]);

  const getOptionsForType = () => {
    switch (testType) {
      case 'title': return titleOptions;
      case 'cover': return coverOptions;
      case 'blurb': return blurbOptions;
      default: return [];
    }
  };

  const runABTest = async () => {
    if (!selectedPersona || !optionA || !optionB) return;

    setIsAnalyzing(true);
    try {
      const persona = personas.find(p => p.id === selectedPersona);
      if (!persona) return;

      const prompt = `
As an AI market research analyst, simulate an A/B test for the following book marketing element:

BOOK CONTEXT: ${bookContent.substring(0, 2000)}

TEST TYPE: ${testType}
OPTION A: ${optionA}
OPTION B: ${optionB}

TARGET PERSONA:
- Name: ${persona.name}
- Demographics: Age: ${persona.demographics.ageRange}, Gender: ${persona.demographics.gender}
- Reading Preferences: ${persona.readingHabits.favoriteGenres.join(', ')}
- Motivations: ${persona.psychographics.motivations.join(', ')}

Based on the book content and this specific persona, predict which option would perform better and provide:

1. Winner (A or B)
2. Confidence level (1-100)
3. Detailed reasoning for why one outperforms the other
4. Simulated metrics (click-through rate, engagement score, conversion probability)
5. Persona-specific insights about their likely response

Format your response as JSON with this structure:
{
  "winner": "A" or "B",
  "confidence": number,
  "reasoning": "detailed explanation",
  "metrics": {
    "clickThroughRate": number (0-100),
    "engagementScore": number (0-100),
    "conversionProbability": number (0-100)
  },
  "personaSpecificInsights": ["insight1", "insight2", "insight3"]
}
      `;

      const result = await AIProcessor.processPrompt(prompt);
      const testResult: ABTestResult = JSON.parse(result);
      
      const newResults = [...results, testResult];
      setResults(newResults);
      onComplete(newResults);
    } catch (error) {
      console.error('A/B test analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            A/B Test Predictor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Type</label>
              <Select value={testType} onValueChange={(value: 'title' | 'cover' | 'blurb') => setTestType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="blurb">Blurb</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Persona</label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger>
                  <SelectValue placeholder="Select persona" />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      {persona.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Option A</label>
              <Select value={optionA} onValueChange={setOptionA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option A" />
                </SelectTrigger>
                <SelectContent>
                  {getOptionsForType().map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option.length > 50 ? `${option.substring(0, 50)}...` : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Option B</label>
              <Select value={optionB} onValueChange={setOptionB}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option B" />
                </SelectTrigger>
                <SelectContent>
                  {getOptionsForType().map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option.length > 50 ? `${option.substring(0, 50)}...` : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={runABTest} 
            disabled={!selectedPersona || !optionA || !optionB || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? 'Running A/B Test...' : 'Run A/B Test Simulation'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Test Result #{index + 1}
                  <Badge variant={result.winner === 'A' ? 'default' : 'secondary'}>
                    Winner: Option {result.winner}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.metrics.clickThroughRate}%
                    </div>
                    <div className="text-sm text-gray-600">Click-Through Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {result.metrics.engagementScore}%
                    </div>
                    <div className="text-sm text-gray-600">Engagement Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {result.metrics.conversionProbability}%
                    </div>
                    <div className="text-sm text-gray-600">Conversion Probability</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Confidence Level</h4>
                  <Progress value={result.confidence} className="w-full" />
                  <p className="text-sm text-gray-600 mt-1">{result.confidence}% confident</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Reasoning</h4>
                  <p className="text-gray-700">{result.reasoning}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Persona-Specific Insights</h4>
                  <ul className="space-y-1">
                    {result.personaSpecificInsights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {insight}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
