import React, { useEffect, useState } from 'react';
import { MobileResponsiveBarChart } from '@/components/MobileResponsiveCharts';

interface ResultItem {
  name: string;
  Gesamtwertung: number;
  Engagement: number;
  Stil: number;
  Klarheit: number;
  Tempo: number;
  Relevanz: number;
}

interface ResultsDashboardProps {
  results: {
    analysis: ResultItem[];
  };
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results }) => {
  const [chartData, setChartData] = useState<ResultItem[]>([]);

  useEffect(() => {
    if (results.analysis && results.analysis.length > 0) {
      setChartData(results.analysis);
    }
  }, [results]);

  const renderAnalysisCharts = () => {
    if (!results.analysis || results.analysis.length === 0) return null;

    const chartData = results.analysis.map(item => ({
      name: item.name,
      Gesamtwertung: item.Gesamtwertung,
      Engagement: item.Engagement,
      Stil: item.Stil,
      Klarheit: item.Klarheit,
      Tempo: item.Tempo,
      Relevanz: item.Relevanz,
    }));

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Bewertungs-Übersicht</h3>
          <MobileResponsiveBarChart
            data={chartData}
            xAxisKey="name"
            yAxisKey="Gesamtwertung"
            categories={['Gesamtwertung', 'Engagement', 'Stil', 'Klarheit', 'Tempo', 'Relevanz']}
            colors={['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#ffb347']}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6">Analyse Ergebnisse</h2>
      {results && results.analysis && results.analysis.length > 0 ? (
        renderAnalysisCharts()
      ) : (
        <p>Keine Ergebnisse vorhanden.</p>
      )}
    </div>
  );
};
