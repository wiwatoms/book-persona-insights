
export interface BookContext {
  content: string;
  metadata: {
    wordCount: number;
    estimatedGenre?: string;
    keyThemes?: string[];
    characterTypes?: string[];
    settingType?: string;
    narrativeStyle?: string;
  };
}

export interface ReaderPersona {
  id: string;
  name: string;
  summary: string;
  demographics: {
    ageRange: string;
    gender: string;
    education: string;
    occupation: string;
  };
  readingHabits: {
    frequency: string;
    preferredFormats: string[];
    favoriteGenres: string[];
    favoriteAuthors: string[];
    discoveryChannels: string[];
  };
  psychographics: {
    values: string[];
    lifestyle: string[];
    motivations: string[];
    painPoints: string[];
  };
  bookConnectionPoints: string[];
}

export interface MarketPosition {
  genre: string;
  subGenres: string[];
  competitorTitles: string[];
  uniqueSellingPoints: string[];
  targetNiches: string[];
  positioningMatrix: {
    tone: number; // 1-10 scale
    complexity: number;
    pacing: number;
    emotionalIntensity: number;
  };
}

export interface TrendAnalysis {
  currentTrends: string[];
  relevantToBook: string[];
  marketGaps: string[];
  opportunities: string[];
}
