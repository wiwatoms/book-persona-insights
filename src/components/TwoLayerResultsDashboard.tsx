
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, Brain, TrendingUp, AlertTriangle, Eye, Download } from 'lucide-react';
import { TwoLayerResult } from './TwoLayerAnalysisEngine';
import { ReaderArchetype } from './BookAnalyzer';

interface TwoLayerResultsDashboardProps {
  results: TwoLayerResult[];
  archetypes: ReaderArchetype[];
}

export const TwoLayerResultsDashboard: React.FC<TwoLayerResultsDashboardProps> = ({
  results,
  archetypes
}) => {
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<number | null>(null);

  const getArchetypeResults = (archetypeId: string) => {
    return results.filter(r => r.archetypeId === archetypeId);
  };

  const getSelectedResult = () => {
    if (!selectedArchetype || selectedChunk === null) return null;
    return results.find(r => r.archetypeId === selectedArchetype && r.chunkIndex === selectedChunk);
  };

  const getEmotionalJourney = (archetypeId: string) => {
    const archetypeResults = getArchetypeResults(archetypeId);
    return archetypeResults.map(result => ({
      chunkIndex: result.chunkIndex,
      averageIntensity: result.emotionalNotes.reduce((sum, note) => sum + note.intensity, 0) / result.emotionalNotes.length || 0,
      dominantEmotion: result.emotionalNotes.length > 0 ? result.emotionalNotes[0].emotion : 'neutral',
      analyticalScore: (
        Object.values(result.analyticalReview.literaryElements).reduce((a, b) => a + b, 0) +
        Object.values(result.analyticalReview.technicalAspects).reduce((a, b) => a + b, 0)
      ) / 8
    }));
  };

  const getCorrelationInsights = (archetypeId: string) => {
    const archetypeResults = getArchetypeResults(archetypeId);
    const discrepancies: string[] = [];
    const strengths: string[] = [];
    
    archetypeResults.forEach(result => {
      const avgEmotional = result.emotionalNotes.reduce((sum, note) => sum + note.intensity, 0) / result.emotionalNotes.length || 0;
      const avgAnalytical = (
        Object.values(result.analyticalReview.literaryElements).reduce((a, b) => a + b, 0) +
        Object.values(result.analyticalReview.technicalAspects).reduce((a, b) => a + b, 0)
      ) / 8;
      
      const diff = Math.abs(avgEmotional - avgAnalytical);
      if (diff > 3) {
        discrepancies.push(`Abschnitt ${result.chunkIndex + 1}: Emotionale vs. analytische Bewertung weichen stark ab`);
      }
      
      if (avgEmotional > 7 && avgAnalytical > 7) {
        strengths.push(`Abschnitt ${result.chunkIndex + 1}: Sowohl emotional als auch analytisch stark`);
      }
    });
    
    return { discrepancies, strengths };
  };

  const exportResults = () => {
    const exportData = {
      analysis: 'Two-Layer Reader Analysis',
      timestamp: new Date().toISOString(),
      archetypes: archetypes.map(archetype => ({
        name: archetype.name,
        results: getArchetypeResults(archetype.id),
        emotionalJourney: getEmotionalJourney(archetype.id),
        correlationInsights: getCorrelationInsights(archetype.id)
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'two-layer-analysis-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedResult = getSelectedResult();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Emotionale Notizen</p>
                <p className="text-2xl font-bold">{results.reduce((sum, r) => sum + r.emotionalNotes.length, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Analytische Reviews</p>
                <p className="text-2xl font-bold">{results.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Durchschn. Bewertung</p>
                <p className="text-2xl font-bold">
                  {(results.reduce((sum, r) => sum + r.overallRating, 0) / results.length || 0).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <Button onClick={exportResults} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="emotional">Emotionale Reise</TabsTrigger>
          <TabsTrigger value="analytical">Analytische Bewertung</TabsTrigger>
          <TabsTrigger value="correlation">Korrelations-Analyse</TabsTrigger>
          <TabsTrigger value="detailed">Detailansicht</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {archetypes.map(archetype => {
              const archetypeResults = getArchetypeResults(archetype.id);
              const avgRating = archetypeResults.reduce((sum, r) => sum + r.overallRating, 0) / archetypeResults.length || 0;
              const avgEmotional = archetypeResults.reduce((sum, r) => 
                sum + (r.emotionalNotes.reduce((noteSum, note) => noteSum + note.intensity, 0) / r.emotionalNotes.length || 0), 0
              ) / archetypeResults.length || 0;
              
              return (
                <Card key={archetype.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{archetype.name}</span>
                      <Badge variant="outline">{archetypeResults.length} Abschnitte</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Analytische Bewertung</p>
                        <Progress value={avgRating * 10} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">{avgRating.toFixed(1)}/10</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Emotionale Intensität</p>
                        <Progress value={avgEmotional * 10} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">{avgEmotional.toFixed(1)}/10</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="emotional" className="space-y-4">
          {archetypes.map(archetype => {
            const journey = getEmotionalJourney(archetype.id);
            return (
              <Card key={archetype.id}>
                <CardHeader>
                  <CardTitle>{archetype.name} - Emotionale Reise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {journey.map((point, index) => (
                      <div key={index} className="flex items-center gap-4 p-2 border rounded">
                        <span className="text-sm font-medium">Abschnitt {point.chunkIndex + 1}</span>
                        <Badge variant="outline">{point.dominantEmotion}</Badge>
                        <div className="flex-1">
                          <Progress value={point.averageIntensity * 10} className="h-2" />
                        </div>
                        <span className="text-xs text-gray-500">{point.averageIntensity.toFixed(1)}/10</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="analytical" className="space-y-4">
          {archetypes.map(archetype => {
            const archetypeResults = getArchetypeResults(archetype.id);
            return (
              <Card key={archetype.id}>
                <CardHeader>
                  <CardTitle>{archetype.name} - Analytische Bewertung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {archetypeResults.map((result, index) => (
                      <div key={index} className="border rounded p-4">
                        <h4 className="font-medium mb-2">Abschnitt {result.chunkIndex + 1}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium mb-1">Literarische Elemente:</p>
                            <ul className="space-y-1">
                              <li>Charakterentwicklung: {result.analyticalReview.literaryElements.characterDevelopment}/10</li>
                              <li>Handlungsfortschritt: {result.analyticalReview.literaryElements.plotProgression}/10</li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Technische Aspekte:</p>
                            <ul className="space-y-1">
                              <li>Tempo: {result.analyticalReview.technicalAspects.pacing}/10</li>
                              <li>Dialog: {result.analyticalReview.technicalAspects.dialogue}/10</li>
                            </ul>
                          </div>
                        </div>
                        {result.analyticalReview.improvementSuggestions.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium text-sm">Verbesserungsvorschläge:</p>
                            <ul className="text-sm text-gray-600 mt-1">
                              {result.analyticalReview.improvementSuggestions.map((suggestion, i) => (
                                <li key={i}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          {archetypes.map(archetype => {
            const insights = getCorrelationInsights(archetype.id);
            return (
              <Card key={archetype.id}>
                <CardHeader>
                  <CardTitle>{archetype.name} - Korrelations-Analyse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.strengths.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-700">Stärken</span>
                      </div>
                      <ul className="space-y-1">
                        {insights.strengths.map((strength, i) => (
                          <li key={i} className="text-sm text-green-600">• {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insights.discrepancies.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-yellow-700">Diskrepanzen</span>
                      </div>
                      <ul className="space-y-1">
                        {insights.discrepancies.map((discrepancy, i) => (
                          <li key={i} className="text-sm text-yellow-600">• {discrepancy}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Archetyp auswählen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {archetypes.map(archetype => (
                    <Button
                      key={archetype.id}
                      variant={selectedArchetype === archetype.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedArchetype(archetype.id);
                        setSelectedChunk(null);
                      }}
                    >
                      {archetype.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedArchetype && (
              <Card>
                <CardHeader>
                  <CardTitle>Abschnitt auswählen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getArchetypeResults(selectedArchetype).map((result, index) => (
                      <Button
                        key={index}
                        variant={selectedChunk === result.chunkIndex ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedChunk(result.chunkIndex)}
                      >
                        Abschnitt {result.chunkIndex + 1}
                        <Badge variant="secondary" className="ml-2">
                          {result.overallRating.toFixed(1)}/10
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Detailansicht
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      Emotionale Notizen
                    </h4>
                    <div className="space-y-2">
                      {selectedResult.emotionalNotes.map((note, i) => (
                        <div key={i} className="border rounded p-2 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline">{note.emotion}</Badge>
                            <span className="text-xs">{note.intensity}/10</span>
                          </div>
                          <p className="text-gray-600">{note.reflection}</p>
                          {note.personalConnection && (
                            <p className="text-xs text-gray-500 mt-1">💭 {note.personalConnection}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-500" />
                      Analytische Bewertung
                    </h4>
                    <div className="text-sm space-y-2">
                      <p className="text-gray-600">{selectedResult.analyticalReview.detailedAnalysis}</p>
                      {selectedResult.layerCorrelation.synthesis && (
                        <div className="border-t pt-2">
                          <p className="font-medium mb-1">Synthese:</p>
                          <p className="text-gray-600">{selectedResult.layerCorrelation.synthesis}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
