
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Target, TrendingUp, Users, Hash, BookOpen } from 'lucide-react';
import { ReaderPersona } from '../BookAnalyzer';
import { useBookContext } from './BookContextProvider';
import { AIProcessor } from './AIProcessor';

interface MarketingAngle {
  title: string;
  description: string;
  keyMessages: string[];
  emotionalTriggers: string[];
  targetPersonas: string[];
}

interface ChannelRecommendation {
  channel: string;
  rationale: string;
  contentStyle: string;
  reach: 'High' | 'Medium' | 'Low';
  cost: 'High' | 'Medium' | 'Low';
  difficulty: 'High' | 'Medium' | 'Low';
}

interface MarketingStrategy {
  angles: MarketingAngle[];
  channels: ChannelRecommendation[];
  keywords: string[];
  taglines: string[];
  campaignIdeas: string[];
}

interface MarketingStrategyModuleProps {
  personas: ReaderPersona[];
  selectedTitle?: string;
  selectedCover?: string;
  selectedBlurb?: string;
  onComplete: (strategy: MarketingStrategy) => void;
}

export const MarketingStrategyModule: React.FC<MarketingStrategyModuleProps> = ({
  personas,
  selectedTitle,
  selectedCover,
  selectedBlurb,
  onComplete
}) => {
  const { bookContent } = useBookContext();
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<MarketingStrategy | null>(null);
  const [activeTab, setActiveTab] = useState('angles');

  const generateStrategy = async () => {
    if (selectedPersonas.length === 0) return;

    setIsGenerating(true);
    try {
      const targetPersonas = personas.filter(p => selectedPersonas.includes(p.id));
      
      const prompt = `
As an AI marketing strategist, create a comprehensive marketing strategy for this book:

BOOK CONTENT: ${bookContent.substring(0, 2000)}

SELECTED MARKETING ASSETS:
- Title: ${selectedTitle || 'Not selected'}
- Cover: ${selectedCover || 'Not selected'}
- Blurb: ${selectedBlurb || 'Not selected'}

TARGET PERSONAS:
${targetPersonas.map(p => `
- ${p.name}: ${p.demographics}
  Reading Preferences: ${p.readingPreferences}
  Motivations: ${p.motivations.join(', ')}
  Pain Points: ${p.painPoints.join(', ')}
`).join('\n')}

Generate a comprehensive marketing strategy including:

1. MARKETING ANGLES (3-4 different approaches)
2. CHANNEL RECOMMENDATIONS (5-7 marketing channels)
3. KEYWORDS for SEO/advertising
4. TAGLINES (3-5 options)
5. CAMPAIGN IDEAS (3-4 creative concepts)

Format as JSON:
{
  "angles": [
    {
      "title": "angle name",
      "description": "detailed description",
      "keyMessages": ["message1", "message2"],
      "emotionalTriggers": ["trigger1", "trigger2"],
      "targetPersonas": ["persona names"]
    }
  ],
  "channels": [
    {
      "channel": "channel name",
      "rationale": "why this channel works",
      "contentStyle": "recommended content approach",
      "reach": "High/Medium/Low",
      "cost": "High/Medium/Low",
      "difficulty": "High/Medium/Low"
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "taglines": ["tagline1", "tagline2"],
  "campaignIdeas": ["idea1", "idea2"]
}
      `;

      const result = await AIProcessor.processRequest(prompt);
      const marketingStrategy: MarketingStrategy = JSON.parse(result);
      
      setStrategy(marketingStrategy);
      onComplete(marketingStrategy);
    } catch (error) {
      console.error('Marketing strategy generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePersona = (personaId: string) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId) 
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Marketing Strategy Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Target Personas (choose 1-3 primary targets)
            </label>
            <div className="flex flex-wrap gap-2">
              {personas.map((persona) => (
                <Badge
                  key={persona.id}
                  variant={selectedPersonas.includes(persona.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => togglePersona(persona.id)}
                >
                  {persona.name}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={generateStrategy} 
            disabled={selectedPersonas.length === 0 || isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating Strategy...' : 'Generate Marketing Strategy'}
          </Button>
        </CardContent>
      </Card>

      {strategy && (
        <Card>
          <CardHeader>
            <CardTitle>Your Marketing Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="angles">Angles</TabsTrigger>
                <TabsTrigger value="channels">Channels</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="taglines">Taglines</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              </TabsList>

              <TabsContent value="angles" className="space-y-4">
                {strategy.angles.map((angle, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {angle.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-gray-700">{angle.description}</p>
                      
                      <div>
                        <h4 className="font-medium mb-2">Key Messages</h4>
                        <ul className="space-y-1">
                          {angle.keyMessages.map((message, idx) => (
                            <li key={idx} className="text-sm">• {message}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Emotional Triggers</h4>
                        <div className="flex flex-wrap gap-1">
                          {angle.emotionalTriggers.map((trigger, idx) => (
                            <Badge key={idx} variant="secondary">{trigger}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Target Personas</h4>
                        <div className="flex flex-wrap gap-1">
                          {angle.targetPersonas.map((persona, idx) => (
                            <Badge key={idx} variant="outline">{persona}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="channels" className="space-y-4">
                {strategy.channels.map((channel, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {channel.channel}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-gray-700">{channel.rationale}</p>
                      
                      <div>
                        <h4 className="font-medium mb-2">Content Style</h4>
                        <p className="text-sm text-gray-600">{channel.contentStyle}</p>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Reach:</span>
                          <Badge variant={channel.reach === 'High' ? 'default' : 'outline'}>
                            {channel.reach}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Cost:</span>
                          <Badge variant={channel.cost === 'Low' ? 'default' : 'outline'}>
                            {channel.cost}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Difficulty:</span>
                          <Badge variant={channel.difficulty === 'Low' ? 'default' : 'outline'}>
                            {channel.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="keywords" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      SEO & Advertising Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {strategy.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="taglines" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Marketing Taglines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {strategy.taglines.map((tagline, index) => (
                        <li key={index} className="p-3 bg-gray-50 rounded-md text-center font-medium">
                          "{tagline}"
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="campaigns" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Creative Campaign Ideas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {strategy.campaignIdeas.map((idea, index) => (
                        <li key={index} className="p-4 border-l-4 border-blue-500 bg-blue-50">
                          <span className="font-medium">Campaign {index + 1}:</span> {idea}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
