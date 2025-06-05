
import React, { createContext, useContext, useState, useEffect } from 'react';
import { BookContext } from './types';

interface BookContextProviderProps {
  children: React.ReactNode;
  bookContent: string;
}

const BookContextContext = createContext<BookContext | null>(null);

export const useBookContext = () => {
  const context = useContext(BookContextContext);
  if (!context) {
    throw new Error('useBookContext must be used within a BookContextProvider');
  }
  return context;
};

export const BookContextProvider: React.FC<BookContextProviderProps> = ({ 
  children, 
  bookContent 
}) => {
  const [bookContext, setBookContext] = useState<BookContext | null>(null);

  useEffect(() => {
    if (bookContent) {
      // Extract basic metadata from book content
      const wordCount = bookContent.split(/\s+/).length;
      
      setBookContext({
        content: bookContent,
        metadata: {
          wordCount,
          // These will be populated by AI analysis
          estimatedGenre: undefined,
          keyThemes: [],
          characterTypes: [],
          settingType: undefined,
          narrativeStyle: undefined,
        }
      });
    }
  }, [bookContent]);

  if (!bookContext) {
    return <div>Loading book context...</div>;
  }

  return (
    <BookContextContext.Provider value={bookContext}>
      {children}
    </BookContextContext.Provider>
  );
};
