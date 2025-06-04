
import React from 'react';
import { BookAnalyzer } from '@/components/BookAnalyzer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            BookInsight Analyzer
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Simulieren Sie fünf unterschiedliche Leser-Archetypen und erhalten Sie detailliertes Feedback 
            und Marketing-Insights für Ihr Buch
          </p>
        </div>
        <BookAnalyzer />
      </div>
    </div>
  );
};

export default Index;
