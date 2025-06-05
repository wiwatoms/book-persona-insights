
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, MessageSquare, BarChart3, Lightbulb, Quote } from 'lucide-react';
import { ReaderArchetype } from './BookAnalyzer';

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

interface TwoLayerAnalysisProps {
  archetype: ReaderArchetype;
  textChunk: string;
  chunkIndex: number;
  aiConfig: any;
  onStreamOfThoughtComplete: (result: StreamOfThoughtResult) => void;
  onAnalyticalInsightComplete: (insight: AnalyticalInsight) => void;
}

export const TwoLayerAnalysis: React.FC<TwoLayerAnalysisProps> = ({
  archetype,
  textChunk,
  chunkIndex,
  aiConfig,
  onStreamOfThoughtComplete,
  onAnalyticalInsightComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [layer1Result, setLayer1Result] = useState<StreamOfThoughtResult | null>(null);
  const [layer2Result, setLayer2Result] = useState<AnalyticalInsight | null>(null);
  const [currentStep, setCurrentStep] = useState<'layer1' | 'layer2' | 'complete'>('layer1');

  const runTwoLayerAnalysis = async (): Promise<void> => {
    setIsProcessing(true);
    setCurrentStep('layer1');

    try {
      // Layer 1: Stream of Thought
      const streamResult = await runStreamOfThoughtAnalysis();
      setLayer1Result(streamResult);
      onStreamOfThoughtComplete(streamResult);
      
      setCurrentStep('layer2');
      
      // Layer 2: Analytical Insights
      const analyticalResult = await runAnalyticalInsight(streamResult);
      setLayer2Result(analyticalResult);
      onAnalyticalInsightComplete(analyticalResult);
      
      setCurrentStep('complete');
      
    } catch (error) {
      console.error('Two-layer analysis failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const runStreamOfThoughtAnalysis = async (): Promise<StreamOfThoughtResult> => {
    const prompt = createStreamOfThoughtPrompt();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Leser und denkst laut. Zeige deine spontanen, unzensierten Gedanken und Emotionen beim Lesen. Antworte nur in gültigem JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // Higher for more creative/emotional responses
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Keine gültige JSON-Antwort erhalten');
    }

    const resultData = JSON.parse(jsonMatch[0]);

    return {
      archetypeId: archetype.id,
      chunkIndex,
      rawThoughts: resultData.rawThoughts,
      emotionalReactions: resultData.emotionalReactions || [],
      immediateQuotes: resultData.immediateQuotes || [],
      fragmentedInsights: resultData.fragmentedInsights || [],
      mood: resultData.mood || 'neutral',
      attentionLevel: resultData.attentionLevel || 5,
      personalResonance: resultData.personalResonance || 5
    };
  };

  const runAnalyticalInsight = async (streamResult: StreamOfThoughtResult): Promise<AnalyticalInsight> => {
    const prompt = createAnalyticalInsightPrompt(streamResult);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein objektiver Marktanalyst. Analysiere die Leserreaktion strukturiert und extrahiere actionable insights. Antworte nur in gültigem JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower for more structured analysis
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Keine gültige JSON-Antwort erhalten');
    }

    const resultData = JSON.parse(jsonMatch[0]);

    return {
      archetypeId: archetype.id,
      chunkIndex,
      keyTakeaways: resultData.keyTakeaways || [],
      structuredFeedback: resultData.structuredFeedback || '',
      marketingOpportunities: resultData.marketingOpportunities || [],
      competitiveAdvantages: resultData.competitiveAdvantages || [],
      riskFactors: resultData.riskFactors || [],
      recommendedActions: resultData.recommendedActions || [],
      confidenceScore: resultData.confidenceScore || 5
    };
  };

  const createStreamOfThoughtPrompt = (): string => {
    return `Du bist ${archetype.name} und liest gerade diesen Textabschnitt. Denke laut und ungefiltert:

DEINE PERSONA:
- ${archetype.description}
- Demografie: ${archetype.demographics}
- Lesegewohnheiten: ${archetype.readingPreferences}
- Persönlichkeit: ${archetype.personalityTraits.join(', ')}
- Motivationen: ${archetype.motivations.join(', ')}
- Pain Points: ${archetype.painPoints.join(', ')}

TEXT ZUM LESEN:
"${textChunk}"

Zeige deine spontanen, unzensierten Gedanken beim Lesen. Sei emotional, fragmentiert, direkt. Als würdest du einem Freund erzählen, was dir durch den Kopf geht.

Antworte NUR in diesem JSON-Format:
{
  "rawThoughts": "Deine ungefilterten Gedanken beim Lesen (1-2 Absätze, sehr persönlich und direkt)",
  "emotionalReactions": ["Emotion 1", "Emotion 2", "Emotion 3"],
  "immediateQuotes": ["Direktes Zitat 1 aus deinen Gedanken", "Direktes Zitat 2"],
  "fragmentedInsights": ["Fragmentierter Gedanke 1", "Fragmentierter Gedanke 2"],
  "mood": "excited/bored/confused/engaged/frustrated/curious",
  "attentionLevel": 0-10,
  "personalResonance": 0-10
}`;
  };

  const createAnalyticalInsightPrompt = (streamResult: StreamOfThoughtResult): string => {
    return `Analysiere objektiv diese Leserreaktion und extrahiere strukturierte Business-Insights:

ORIGINAL TEXT:
"${textChunk}"

LESER-PERSONA: ${archetype.name}
${archetype.description}

ROHE LESERREAKTION (Layer 1):
Gedanken: ${streamResult.rawThoughts}
Emotionen: ${streamResult.emotionalReactions.join(', ')}
Stimmung: ${streamResult.mood}
Aufmerksamkeit: ${streamResult.attentionLevel}/10
Resonanz: ${streamResult.personalResonance}/10

AUFGABE: Erstelle eine objektive, strukturierte Analyse für Buchvermarkter und Autoren.

Antworte NUR in diesem JSON-Format:
{
  "keyTakeaways": ["Wichtigste Erkenntnis 1", "Wichtigste Erkenntnis 2", "Wichtigste Erkenntnis 3"],
  "structuredFeedback": "Objektive Zusammenfassung der Stärken/Schwächen dieses Textabschnitts (100-150 Wörter)",
  "marketingOpportunities": ["Marketing-Chance 1", "Marketing-Chance 2"],
  "competitiveAdvantages": ["Wettbewerbsvorteil 1", "Wettbewerbsvorteil 2"],
  "riskFactors": ["Risikofaktor 1", "Risikofaktor 2"],
  "recommendedActions": ["Handlungsempfehlung 1", "Handlungsempfehlung 2"],
  "confidenceScore": 0-10
}`;
  };

  return (
    <div className="space-y-4">
      {!layer1Result && !layer2Result && (
        <Button onClick={runTwoLayerAnalysis} disabled={isProcessing}>
          <Brain className="w-4 h-4 mr-2" />
          {isProcessing ? 'Analysiere...' : 'Zwei-Ebenen-Analyse starten'}
        </Button>
      )}

      {isProcessing && (
        <Alert className="bg-blue-50 border-blue-200">
          <Brain className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {currentStep === 'layer1' && "Layer 1: Stream of Thought wird generiert..."}
            {currentStep === 'layer2' && "Layer 2: Analytische Insights werden extrahiert..."}
          </AlertDescription>
        </Alert>
      )}

      {(layer1Result || layer2Result) && (
        <Tabs defaultValue="layer1" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layer1" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Layer 1: Stream of Thought
            </TabsTrigger>
            <TabsTrigger value="layer2" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Layer 2: Analytische Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="layer1" className="space-y-4">
            {layer1Result && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Quote className="w-5 h-5 text-purple-600" />
                    Raw Thoughts: {archetype.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">Stimmung: {layer1Result.mood}</Badge>
                    <Badge variant="outline">Aufmerksamkeit: {layer1Result.attentionLevel}/10</Badge>
                    <Badge variant="outline">Resonanz: {layer1Result.personalResonance}/10</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-purple-800 mb-2">Ungefilterte Gedanken:</h4>
                    <p className="text-purple-700 italic bg-white/50 p-3 rounded">
                      "{layer1Result.rawThoughts}"
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-purple-800 mb-2">Emotionale Reaktionen:</h4>
                    <div className="flex flex-wrap gap-2">
                      {layer1Result.emotionalReactions.map((emotion, idx) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-800">
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-purple-800 mb-2">Direkte Zitate:</h4>
                    <div className="space-y-2">
                      {layer1Result.immediateQuotes.map((quote, idx) => (
                        <p key={idx} className="text-purple-700 bg-white/50 p-2 rounded text-sm">
                          "—{quote}"
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-purple-800 mb-2">Fragmentierte Insights:</h4>
                    <div className="space-y-1">
                      {layer1Result.fragmentedInsights.map((insight, idx) => (
                        <p key={idx} className="text-purple-700 text-sm">• {insight}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="layer2" className="space-y-4">
            {layer2Result && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                    Strukturierte Analyse: {archetype.name}
                  </CardTitle>
                  <Badge variant="outline" className="w-fit">
                    Konfidenz: {layer2Result.confidenceScore}/10
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Key Takeaways:</h4>
                    <div className="space-y-1">
                      {layer2Result.keyTakeaways.map((takeaway, idx) => (
                        <p key={idx} className="text-green-700 text-sm">✓ {takeaway}</p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Strukturiertes Feedback:</h4>
                    <p className="text-green-700 bg-white/50 p-3 rounded text-sm">
                      {layer2Result.structuredFeedback}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">Marketing Opportunities:</h4>
                      <div className="space-y-1">
                        {layer2Result.marketingOpportunities.map((opp, idx) => (
                          <p key={idx} className="text-green-600 text-sm">📈 {opp}</p>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-green-800 mb-2">Wettbewerbsvorteile:</h4>
                      <div className="space-y-1">
                        {layer2Result.competitiveAdvantages.map((adv, idx) => (
                          <p key={idx} className="text-green-600 text-sm">⭐ {adv}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">Risikofaktoren:</h4>
                      <div className="space-y-1">
                        {layer2Result.riskFactors.map((risk, idx) => (
                          <p key={idx} className="text-red-600 text-sm">⚠️ {risk}</p>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">Handlungsempfehlungen:</h4>
                      <div className="space-y-1">
                        {layer2Result.recommendedActions.map((action, idx) => (
                          <p key={idx} className="text-blue-600 text-sm">💡 {action}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
