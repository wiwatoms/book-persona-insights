
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReaderArchetype, AnalysisResult } from './BookAnalyzer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Star, ShoppingCart, MessageSquare, Users, Download, FileText } from 'lucide-react';

interface ResultsDashboardProps {
  results: AnalysisResult[];
  archetypes: ReaderArchetype[];
  textLength: number;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  archetypes,
  textLength
}) => {
  const [selectedArchetype, setSelectedArchetype] = useState<string>('all');

  // Calculate aggregate metrics
  const getAggregateMetrics = () => {
    const archetypeMetrics = archetypes.map(archetype => {
      const archetypeResults = results.filter(r => r.archetypeId === archetype.id);
      const lastResult = archetypeResults[archetypeResults.length - 1];
      
      const avgOverall = archetypeResults.reduce((sum, r) => sum + r.overallRating, 0) / archetypeResults.length;
      const avgBuying = archetypeResults.reduce((sum, r) => sum + r.buyingProbability, 0) / archetypeResults.length;
      const avgRecommendation = archetypeResults.reduce((sum, r) => sum + r.recommendationLikelihood, 0) / archetypeResults.length;
      
      const positiveReviews = archetypeResults.filter(r => r.expectedReviewSentiment === 'positive').length;
      const neutralReviews = archetypeResults.filter(r => r.expectedReviewSentiment === 'neutral').length;
      const negativeReviews = archetypeResults.filter(r => r.expectedReviewSentiment === 'negative').length;

      return {
        archetype,
        avgOverall: Math.round(avgOverall * 10) / 10,
        avgBuying: Math.round(avgBuying * 100),
        avgRecommendation: Math.round(avgRecommendation * 100),
        finalRating: lastResult?.overallRating || 0,
        finalBuying: Math.round((lastResult?.buyingProbability || 0) * 100),
        finalRecommendation: Math.round((lastResult?.recommendationLikelihood || 0) * 100),
        reviewSentiment: lastResult?.expectedReviewSentiment || 'neutral',
        positiveReviews,
        neutralReviews,
        negativeReviews,
        totalChunks: archetypeResults.length
      };
    });

    return archetypeMetrics;
  };

  const aggregateMetrics = getAggregateMetrics();
  const overallAvgRating = aggregateMetrics.reduce((sum, m) => sum + m.finalRating, 0) / aggregateMetrics.length;
  const overallBuyingProb = aggregateMetrics.reduce((sum, m) => sum + m.finalBuying, 0) / aggregateMetrics.length;

  // Data for charts
  const ratingProgressData = archetypes.map(archetype => {
    const archetypeResults = results.filter(r => r.archetypeId === archetype.id);
    return {
      name: archetype.name,
      data: archetypeResults.map((r, idx) => ({
        chunk: idx + 1,
        rating: r.overallRating,
        buying: r.buyingProbability * 100,
        recommendation: r.recommendationLikelihood * 100
      }))
    };
  });

  const categoryComparisonData = archetypes.map(archetype => {
    const archetypeResults = results.filter(r => r.archetypeId === archetype.id);
    const lastResult = archetypeResults[archetypeResults.length - 1];
    
    if (!lastResult) return null;

    return {
      archetype: archetype.name.split(' ')[archetype.name.split(' ').length - 1], // Last word for shorter labels
      engagement: lastResult.ratings.engagement,
      style: lastResult.ratings.style,
      clarity: lastResult.ratings.clarity,
      pacing: lastResult.ratings.pacing,
      relevance: lastResult.ratings.relevance,
      overall: lastResult.overallRating
    };
  }).filter(Boolean);

  const marketingInsightsData = () => {
    const allInsights: string[] = [];
    results.forEach(r => allInsights.push(...r.marketingInsights));
    
    const insightCounts = allInsights.reduce((acc, insight) => {
      acc[insight] = (acc[insight] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(insightCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([insight, count]) => ({ insight, count }));
  };

  const exportReport = () => {
    const reportData = {
      summary: {
        totalArchetypes: archetypes.length,
        totalAnalyzedChunks: results.length,
        textLength,
        overallRating: Math.round(overallAvgRating * 10) / 10,
        overallBuyingProbability: Math.round(overallBuyingProb)
      },
      archetypeResults: aggregateMetrics,
      detailedResults: results
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'buchanalyse-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Gesamtbewertung</p>
                <p className="text-3xl font-bold text-blue-800">
                  {Math.round(overallAvgRating * 10) / 10}/5
                </p>
              </div>
              <Star className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Kaufwahrscheinlichkeit</p>
                <p className="text-3xl font-bold text-green-800">
                  {Math.round(overallBuyingProb)}%
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Positive Reviews</p>
                <p className="text-3xl font-bold text-purple-800">
                  {aggregateMetrics.filter(m => m.reviewSentiment === 'positive').length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Analysierte Abschnitte</p>
                <p className="text-3xl font-bold text-orange-800">
                  {results.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList className="bg-white/70 backdrop-blur-sm border">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="archetypes">Archetypen</TabsTrigger>
            <TabsTrigger value="progress">Verlauf</TabsTrigger>
            <TabsTrigger value="insights">Marketing-Insights</TabsTrigger>
          </TabsList>
          
          <Button onClick={exportReport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Report exportieren
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Archetype Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Bewertung nach Kategorien</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={categoryComparisonData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="archetype" />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} />
                  <Radar name="Engagement" dataKey="engagement" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                  <Radar name="Stil" dataKey="style" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
                  <Radar name="Klarheit" dataKey="clarity" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} />
                  <Radar name="Tempo" dataKey="pacing" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} />
                  <Radar name="Relevanz" dataKey="relevance" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Final Ratings Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Finale Bewertungen der Archetypen</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aggregateMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="archetype.name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Bewertung']}
                    labelFormatter={(label) => `Archetyp: ${label}`}
                  />
                  <Bar dataKey="finalRating" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archetypes" className="space-y-6">
          {/* Individual Archetype Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aggregateMetrics.map((metric) => (
              <Card key={metric.archetype.id} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{metric.archetype.name}</span>
                    <div className="flex gap-2">
                      <Badge 
                        variant={metric.reviewSentiment === 'positive' ? 'default' : 
                               metric.reviewSentiment === 'neutral' ? 'secondary' : 'destructive'}
                      >
                        {metric.reviewSentiment === 'positive' ? 'Positiv' :
                         metric.reviewSentiment === 'neutral' ? 'Neutral' : 'Negativ'}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded">
                      <div className="text-2xl font-bold text-slate-800">{metric.finalRating}/5</div>
                      <div className="text-sm text-slate-600">Finale Bewertung</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded">
                      <div className="text-2xl font-bold text-slate-800">{metric.finalBuying}%</div>
                      <div className="text-sm text-slate-600">Kaufwahrscheinlichkeit</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-slate-50 rounded">
                    <div className="text-xl font-bold text-slate-800">{metric.finalRecommendation}%</div>
                    <div className="text-sm text-slate-600">Weiterempfehlung</div>
                  </div>

                  <div className="text-sm text-slate-600">
                    <p><strong>Analysierte Abschnitte:</strong> {metric.totalChunks}</p>
                    <p className="mt-2">{metric.archetype.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {/* Progress Charts for each archetype */}
          {ratingProgressData.map((archetypeData) => (
            <Card key={archetypeData.name}>
              <CardHeader>
                <CardTitle>Bewertungsverlauf: {archetypeData.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={archetypeData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="chunk" />
                    <YAxis yAxisId="rating" orientation="left" domain={[0, 5]} />
                    <YAxis yAxisId="percent" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      yAxisId="rating"
                      type="monotone" 
                      dataKey="rating" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Bewertung (1-5)"
                    />
                    <Line 
                      yAxisId="percent"
                      type="monotone" 
                      dataKey="buying" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Kaufwahrscheinlichkeit (%)"
                    />
                    <Line 
                      yAxisId="percent"
                      type="monotone" 
                      dataKey="recommendation" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Weiterempfehlung (%)"
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Marketing Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Top Marketing-Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketingInsightsData().map((insight, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded">
                    <span className="text-slate-800">{insight.insight}</span>
                    <Badge variant="outline">{insight.count}x erwähnt</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations by Archetype */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aggregateMetrics.map((metric) => {
              const archetypeResults = results.filter(r => r.archetypeId === metric.archetype.id);
              const uniqueInsights = [...new Set(archetypeResults.flatMap(r => r.marketingInsights))];
              
              return (
                <Card key={metric.archetype.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{metric.archetype.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-slate-600">Marketing-Empfehlungen:</h4>
                      <ul className="space-y-1">
                        {uniqueInsights.slice(0, 4).map((insight, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
