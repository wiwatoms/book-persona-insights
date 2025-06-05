
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArchetypeManager } from './ArchetypeManager';
import { Button } from '@/components/ui/button';
import { InfoIcon, BookOpen, Users, BarChart2, BookMarked, Layers, MessageSquare, Lightbulb } from 'lucide-react';
import { ReaderArchetype, AnalysisResult, StreamOfThoughtResult, AnalyticalInsight } from './BookAnalyzer';
import { MobileChartWrapper, MobileOptimizedText, MobilePaginatedContent } from './MobileOptimizedUI';
import { MobileResponsiveBarChart, MobileResponsiveLineChart, MobileResponsivePieChart } from './MobileResponsiveCharts';
import { isMobile } from '@/hooks/use-mobile';

interface ResultsDashboardProps {
  results: AnalysisResult[];
  streamOfThoughtResults?: StreamOfThoughtResult[];
  analyticalInsights?: AnalyticalInsight[];
  archetypes: ReaderArchetype[];
  textLength: number;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  streamOfThoughtResults = [],
  analyticalInsights = [],
  archetypes,
  textLength
}) => {
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string | null>(
    archetypes.length > 0 ? archetypes[0].id : null
  );
  const [selectedTab, setSelectedTab] = useState('general');
  const mobile = isMobile();

  const filteredResults = useMemo(
    () => selectedArchetypeId ? results.filter(result => result.archetypeId === selectedArchetypeId) : results,
    [results, selectedArchetypeId]
  );

  const selectedArchetype = useMemo(
    () => archetypes.find(arch => arch.id === selectedArchetypeId),
    [archetypes, selectedArchetypeId]
  );

  const hasLayeredAnalysis = streamOfThoughtResults.length > 0 && analyticalInsights.length > 0;

  // Aggregate ratings by archetype
  const aggregateByArchetype = useMemo(() => {
    const aggregates: { 
      archetypeId: string; 
      name: string;
      overallRating: number;
      engagement: number;
      style: number;
      clarity: number;
      pacing: number;
      relevance: number;
      buyingProbability: number;
      count: number;
    }[] = [];

    archetypes.forEach(archetype => {
      const archetypeResults = results.filter(result => result.archetypeId === archetype.id);
      if (archetypeResults.length === 0) return;

      const overallSum = archetypeResults.reduce((sum, result) => sum + result.overallRating, 0);
      const engagementSum = archetypeResults.reduce((sum, result) => sum + result.ratings.engagement, 0);
      const styleSum = archetypeResults.reduce((sum, result) => sum + result.ratings.style, 0);
      const claritySum = archetypeResults.reduce((sum, result) => sum + result.ratings.clarity, 0);
      const pacingSum = archetypeResults.reduce((sum, result) => sum + result.ratings.pacing, 0);
      const relevanceSum = archetypeResults.reduce((sum, result) => sum + result.ratings.relevance, 0);
      const buyingSum = archetypeResults.reduce((sum, result) => sum + result.buyingProbability, 0);

      aggregates.push({
        archetypeId: archetype.id,
        name: archetype.name,
        overallRating: parseFloat((overallSum / archetypeResults.length).toFixed(1)),
        engagement: parseFloat((engagementSum / archetypeResults.length).toFixed(1)),
        style: parseFloat((styleSum / archetypeResults.length).toFixed(1)),
        clarity: parseFloat((claritySum / archetypeResults.length).toFixed(1)),
        pacing: parseFloat((pacingSum / archetypeResults.length).toFixed(1)),
        relevance: parseFloat((relevanceSum / archetypeResults.length).toFixed(1)),
        buyingProbability: parseFloat((buyingSum / archetypeResults.length).toFixed(2)),
        count: archetypeResults.length
      });
    });

    return aggregates;
  }, [results, archetypes]);

  // Extract marketing insights
  const marketingInsights = useMemo(() => {
    const insights: { 
      archetypeId: string;
      archetypeName: string;
      insight: string;
      chunkIndex: number;
    }[] = [];

    results.forEach(result => {
      const archetype = archetypes.find(arch => arch.id === result.archetypeId);
      if (!archetype) return;

      result.marketingInsights.forEach(insight => {
        insights.push({
          archetypeId: result.archetypeId,
          archetypeName: archetype.name,
          insight,
          chunkIndex: result.chunkIndex
        });
      });
    });

    return insights;
  }, [results, archetypes]);

  // Get two-layer analysis results for current archetype
  const twoLayerResults = useMemo(() => {
    if (!selectedArchetypeId) return [];
    
    // Combine stream-of-thought results with analytical insights
    const combined = [];
    
    for (const streamResult of streamOfThoughtResults.filter(r => r.archetypeId === selectedArchetypeId)) {
      const matchingInsight = analyticalInsights.find(
        i => i.archetypeId === selectedArchetypeId && i.chunkIndex === streamResult.chunkIndex
      );
      
      if (matchingInsight) {
        combined.push({
          chunkIndex: streamResult.chunkIndex,
          streamOfThought: streamResult,
          analyticalInsight: matchingInsight
        });
      }
    }
    
    return combined;
  }, [selectedArchetypeId, streamOfThoughtResults, analyticalInsights]);

  // Calculate sentiment distribution
  const sentimentDistribution = useMemo(() => {
    const distribution = { positive: 0, neutral: 0, negative: 0 };
    
    filteredResults.forEach(result => {
      distribution[result.expectedReviewSentiment]++;
    });
    
    return [
      { name: 'Positiv', value: distribution.positive },
      { name: 'Neutral', value: distribution.neutral },
      { name: 'Negativ', value: distribution.negative }
    ];
  }, [filteredResults]);
  
  // Prepare data for rating charts
  const ratingChartData = useMemo(() => {
    return aggregateByArchetype.map(data => ({
      name: data.name,
      Gesamtwertung: data.overallRating,
      Engagement: data.engagement,
      Stil: data.style,
      Klarheit: data.clarity,
      Tempo: data.pacing,
      Relevanz: data.relevance
    }));
  }, [aggregateByArchetype]);

  // Prepare data for buying probability chart
  const buyingProbChartData = useMemo(() => {
    return aggregateByArchetype.map(data => ({
      name: data.name,
      'Kauf-Wahrscheinlichkeit': Math.round(data.buyingProbability * 100)
    }));
  }, [aggregateByArchetype]);

  return (
    <div className="space-y-8">
      {/* Archetype Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              <div className="mb-2 text-sm font-medium">Zielgruppe auswählen:</div>
              <Select
                value={selectedArchetypeId || ''}
                onValueChange={setSelectedArchetypeId}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Alle Archetypen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle Archetypen</SelectItem>
                  {archetypes.map((archetype) => (
                    <SelectItem key={archetype.id} value={archetype.id}>
                      {archetype.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">{results.length}</span> Bewertungen 
                <span className="ml-2 font-medium text-slate-800">{archetypes.length}</span> Archetypen
              </div>
              
              {selectedArchetype && (
                <Badge variant="outline" className="bg-blue-50 text-blue-800">
                  {selectedArchetype.name}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="general" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4 grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Übersicht</span>
            <span className="sm:hidden">Übersicht</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Marketing Insights</span>
            <span className="sm:hidden">Insights</span>
          </TabsTrigger>
          {hasLayeredAnalysis && (
            <TabsTrigger value="two-layer" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Two-Layer Analyse</span>
              <span className="sm:hidden">2-Layer</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="raw-data" className="flex items-center gap-2">
            <BookMarked className="w-4 h-4" />
            <span className="hidden sm:inline">Detaildaten</span>
            <span className="sm:hidden">Details</span>
          </TabsTrigger>
        </TabsList>

        {/* General Overview Tab */}
        <TabsContent value="general" className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {aggregateByArchetype.slice(0, 4).map((data) => (
              <Card key={data.archetypeId} className={`${
                data.overallRating >= 8 ? 'bg-green-50' : 
                data.overallRating >= 6 ? 'bg-blue-50' : 
                data.overallRating >= 4 ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-medium">{data.name}</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold mb-1">
                    {data.overallRating}/10
                  </div>
                  <div className="text-sm">
                    Kaufwahrscheinlichkeit: {(data.buyingProbability * 100).toFixed(0)}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Charts - Optimized for Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating Chart */}
            <MobileChartWrapper 
              title="Gesamtbewertungen nach Archetyp" 
              description="Durchschnittliche Bewertungen (1-10)"
            >
              <MobileResponsiveBarChart 
                data={ratingChartData}
                xAxisKey="name"
                yAxisKey="Gesamtwertung"
                colors={['blue']}
                className="w-full"
              />
            </MobileChartWrapper>

            {/* Buying Probability Chart */}
            <MobileChartWrapper 
              title="Kaufwahrscheinlichkeit (%)" 
              description="Wahrscheinlichkeit eines Kaufs nach Leserarchetyp"
            >
              <MobileResponsiveBarChart 
                data={buyingProbChartData}
                xAxisKey="name"
                yAxisKey="Kauf-Wahrscheinlichkeit"
                colors={['green']}
                className="w-full"
              />
            </MobileChartWrapper>
            
            {/* Sentiment Distribution Chart */}
            <MobileChartWrapper 
              title="Sentiment-Verteilung" 
              description="Verteilung positiver, neutraler und negativer Bewertungen"
            >
              <MobileResponsivePieChart 
                data={sentimentDistribution}
                category="value"
                colors={['green', 'blue', 'red']}
                className="w-full"
              />
            </MobileChartWrapper>

            {/* Radar Chart of All Ratings */}
            <MobileChartWrapper 
              title="Detailbewertungen" 
              description="Vergleich der verschiedenen Bewertungskategorien"
            >
              <MobileResponsiveBarChart 
                data={selectedArchetypeId ? 
                  [ratingChartData.find(d => d.name === selectedArchetype?.name) || ratingChartData[0]] : 
                  ratingChartData[0] ? [ratingChartData[0]] : []
                }
                xAxisKey={''}
                categories={['Gesamtwertung', 'Engagement', 'Stil', 'Klarheit', 'Tempo', 'Relevanz']}
                colors={['purple', 'blue', 'cyan', 'green', 'yellow', 'orange']}
                className="w-full"
              />
            </MobileChartWrapper>
          </div>
        </TabsContent>

        {/* Marketing Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Marketing Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mobile ? (
                <MobilePaginatedContent
                  items={marketingInsights.filter(insight => 
                    !selectedArchetypeId || insight.archetypeId === selectedArchetypeId
                  )}
                  itemsPerPage={5}
                  title="Top Marketing-Insights"
                  renderItem={(item, index) => (
                    <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">
                          {item.archetypeName}
                        </Badge>
                        <span className="text-xs text-slate-500">Abschnitt {item.chunkIndex + 1}</span>
                      </div>
                      <p className="text-sm">{item.insight}</p>
                    </div>
                  )}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketingInsights
                    .filter(insight => !selectedArchetypeId || insight.archetypeId === selectedArchetypeId)
                    .slice(0, 12)
                    .map((item, index) => (
                      <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-800">
                            {item.archetypeName}
                          </Badge>
                          <span className="text-xs text-slate-500">Abschnitt {item.chunkIndex + 1}</span>
                        </div>
                        <p className="text-sm">{item.insight}</p>
                      </div>
                    ))
                  }
                </div>
              )}

              {marketingInsights.length === 0 && (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    Keine Marketing Insights verfügbar.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {analyticalInsights.length > 0 && selectedArchetypeId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Strukturierte Marketing-Empfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticalInsights
                    .filter(insight => insight.archetypeId === selectedArchetypeId)
                    .slice(0, 3)
                    .map((insight, idx) => (
                      <div key={idx} className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-3">Top Empfehlungen:</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-green-700 mb-1">Marketing-Chancen:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {insight.marketingOpportunities.map((opp, i) => (
                                <li key={i} className="text-sm text-green-600">{opp}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-green-700 mb-1">Empfohlene Maßnahmen:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {insight.recommendedActions.map((action, i) => (
                                <li key={i} className="text-sm text-green-600">{action}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Two-Layer Analysis Tab */}
        {hasLayeredAnalysis && (
          <TabsContent value="two-layer" className="space-y-6">
            {!selectedArchetypeId ? (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Bitte wählen Sie einen Archetyp, um die Two-Layer-Analyse zu sehen.
                </AlertDescription>
              </Alert>
            ) : twoLayerResults.length === 0 ? (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Keine Two-Layer-Analyseergebnisse verfügbar für {selectedArchetype?.name}.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Layer 1 and 2 Tabs For Each Section */}
                {twoLayerResults.slice(0, 3).map((result, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <CardTitle className="text-lg">
                          Textabschnitt {result.chunkIndex + 1}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-purple-50 text-purple-800">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Stream of Thought
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-800">
                            <Lightbulb className="w-3 h-3 mr-1" />
                            Analytische Insights
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <Tabs defaultValue="layer1">
                        <TabsList className="w-full grid grid-cols-2">
                          <TabsTrigger value="layer1">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Gedankenstrom
                          </TabsTrigger>
                          <TabsTrigger value="layer2">
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Analyseergebnisse
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="layer1" className="space-y-4 pt-4">
                          <MobileOptimizedText 
                            title="Ungefilterte Gedanken" 
                            content={result.streamOfThought.rawThoughts}
                            variant="feedback"
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Emotionale Reaktionen:</h4>
                              <div className="flex flex-wrap gap-2">
                                {result.streamOfThought.emotionalReactions.map((emotion, i) => (
                                  <Badge key={i} className="bg-purple-100 text-purple-800">{emotion}</Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm mb-2">Direkte Zitate:</h4>
                              <div className="space-y-1">
                                {result.streamOfThought.immediateQuotes.map((quote, i) => (
                                  <p key={i} className="text-sm italic bg-purple-50 p-2 rounded">"{quote}"</p>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Fragmentierte Insights:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {result.streamOfThought.fragmentedInsights.map((insight, i) => (
                                  <li key={i} className="text-sm">{insight}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm mb-2">Messwerte:</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Stimmung:</span>
                                  <span className="font-medium">{result.streamOfThought.mood}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Aufmerksamkeitslevel:</span>
                                  <span className="font-medium">{result.streamOfThought.attentionLevel}/10</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Persönliche Resonanz:</span>
                                  <span className="font-medium">{result.streamOfThought.personalResonance}/10</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="layer2" className="space-y-4 pt-4">
                          <MobileOptimizedText 
                            title="Strukturiertes Feedback" 
                            content={result.analyticalInsight.structuredFeedback}
                            variant="insight"
                          />
                          
                          <div>
                            <h4 className="font-medium text-sm mb-2">Key Takeaways:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {result.analyticalInsight.keyTakeaways.map((takeaway, i) => (
                                <li key={i} className="text-sm">{takeaway}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Marketing-Chancen:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {result.analyticalInsight.marketingOpportunities.map((opp, i) => (
                                  <li key={i} className="text-sm">{opp}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm mb-2">Wettbewerbsvorteile:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {result.analyticalInsight.competitiveAdvantages.map((adv, i) => (
                                  <li key={i} className="text-sm">{adv}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Risikofaktoren:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {result.analyticalInsight.riskFactors.map((risk, i) => (
                                  <li key={i} className="text-sm text-red-600">{risk}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm mb-2">Handlungsempfehlungen:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {result.analyticalInsight.recommendedActions.map((action, i) => (
                                  <li key={i} className="text-sm text-green-600">{action}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Badge variant="outline">
                              Konfidenz: {result.analyticalInsight.confidenceScore}/10
                            </Badge>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
                
                {twoLayerResults.length > 3 && (
                  <div className="flex justify-center">
                    <Button variant="outline">
                      Weitere Abschnitte anzeigen ({twoLayerResults.length - 3})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        )}

        {/* Raw Data Tab */}
        <TabsContent value="raw-data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Detaillierte Bewertungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mobile ? (
                <MobilePaginatedContent
                  items={filteredResults}
                  itemsPerPage={3}
                  title="Detaillierte Bewertungen"
                  renderItem={(result, index) => {
                    const archetype = archetypes.find(a => a.id === result.archetypeId);
                    return (
                      <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-800">
                            {archetype?.name || 'Unbekannt'}
                          </Badge>
                          <div className="flex items-center">
                            <div className={`px-2 py-1 rounded text-sm font-medium ${
                              result.overallRating >= 8 ? 'bg-green-100 text-green-800' : 
                              result.overallRating >= 6 ? 'bg-blue-100 text-blue-800' : 
                              result.overallRating >= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {result.overallRating}/10
                            </div>
                          </div>
                        </div>
                        
                        <MobileOptimizedText
                          title="Feedback"
                          content={result.feedback}
                          maxPreviewLength={100}
                        />
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Bewertungen:</h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Engagement:</span>
                              <span className="font-medium">{result.ratings.engagement}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Stil:</span>
                              <span className="font-medium">{result.ratings.style}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Klarheit:</span>
                              <span className="font-medium">{result.ratings.clarity}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tempo:</span>
                              <span className="font-medium">{result.ratings.pacing}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Relevanz:</span>
                              <span className="font-medium">{result.ratings.relevance}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Kaufwahrscheinlichkeit:</span>
                              <span className="font-medium">{(result.buyingProbability * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {filteredResults.slice(0, 6).map((result, index) => {
                    const archetype = archetypes.find(a => a.id === result.archetypeId);
                    return (
                      <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-800">
                              {archetype?.name || 'Unbekannt'}
                            </Badge>
                            <span className="ml-2 text-sm text-slate-500">Abschnitt {result.chunkIndex + 1}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm">
                              Sentiment: {result.expectedReviewSentiment}
                            </div>
                            <div className={`px-2 py-1 rounded text-sm font-medium ${
                              result.overallRating >= 8 ? 'bg-green-100 text-green-800' : 
                              result.overallRating >= 6 ? 'bg-blue-100 text-blue-800' : 
                              result.overallRating >= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {result.overallRating}/10
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-medium mb-2">Feedback:</h4>
                            <p className="text-sm">{result.feedback}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Ratings:</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Engagement:</span>
                                <span className="font-medium">{result.ratings.engagement}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Stil:</span>
                                <span className="font-medium">{result.ratings.style}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Klarheit:</span>
                                <span className="font-medium">{result.ratings.clarity}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tempo:</span>
                                <span className="font-medium">{result.ratings.pacing}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Relevanz:</span>
                                <span className="font-medium">{result.ratings.relevance}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Kauf:</span>
                                <span className="font-medium">{(result.buyingProbability * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredResults.length > 6 && (
                    <div className="flex justify-center">
                      <Button variant="outline">
                        Mehr Bewertungen anzeigen ({filteredResults.length - 6})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
