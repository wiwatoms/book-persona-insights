
import React from 'react';
import { BookAnalyzer } from '@/components/BookAnalyzer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Literary Intelligence Suite
          </h1>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto">
            Zwei-Ebenen-Analyse: Emotionale Reaktionen + Analytische Bewertung mit Korrelations-Insights und Market Validation für Ihr Buch
          </p>
        </div>
        <BookAnalyzer />
      </div>
    </div>
  );
};

export default Index;
