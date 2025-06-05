
interface ChunkInfo {
  content: string;
  chunkType: 'chapter' | 'section' | 'paragraph' | 'automatic';
  title?: string;
  index: number;
  wordCount: number;
}

interface ChunkingOptions {
  maxWordsPerChunk: number;
  minWordsPerChunk: number;
  preserveStructure: boolean;
}

export class TextChunker {
  private static readonly DEFAULT_OPTIONS: ChunkingOptions = {
    maxWordsPerChunk: 400,
    minWordsPerChunk: 100,
    preserveStructure: true
  };

  static createChunks(content: string, options: Partial<ChunkingOptions> = {}): ChunkInfo[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // First, try to detect table of contents or chapter structure
    const structuredChunks = this.tryStructuredChunking(content, opts);
    if (structuredChunks.length > 1) {
      console.log('Using structured chunking based on detected chapters/sections');
      return structuredChunks;
    }

    // Fall back to semantic paragraph-based chunking
    console.log('Using semantic paragraph-based chunking');
    return this.semanticChunking(content, opts);
  }

  private static tryStructuredChunking(content: string, options: ChunkingOptions): ChunkInfo[] {
    const chunks: ChunkInfo[] = [];
    
    // Detect chapter patterns
    const chapterPatterns = [
      /^(Chapter\s+\d+|Kapitel\s+\d+|CHAPTER\s+\d+)[\s\S]*?(?=^(Chapter\s+\d+|Kapitel\s+\d+|CHAPTER\s+\d+)|\Z)/gim,
      /^(\d+\.\s+[A-Z][^\n]*\n)[\s\S]*?(?=^\d+\.\s+[A-Z]|\Z)/gim,
      /^([IVX]+\.\s+[A-Z][^\n]*\n)[\s\S]*?(?=^[IVX]+\.\s+[A-Z]|\Z)/gim
    ];

    for (const pattern of chapterPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 2) { // At least 3 chapters for reliable structure
        matches.forEach((match, index) => {
          const titleMatch = match.match(/^([^\n]+)/);
          const title = titleMatch ? titleMatch[1].trim() : `Abschnitt ${index + 1}`;
          const wordCount = match.trim().split(/\s+/).length;
          
          if (wordCount >= options.minWordsPerChunk) {
            chunks.push({
              content: match.trim(),
              chunkType: 'chapter',
              title: title,
              index: index,
              wordCount: wordCount
            });
          }
        });
        
        if (chunks.length > 0) {
          return chunks;
        }
      }
    }

    return [];
  }

  private static semanticChunking(content: string, options: ChunkingOptions): ChunkInfo[] {
    const chunks: ChunkInfo[] = [];
    
    // Split by paragraphs first
    const paragraphs = content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 20); // Filter out very short paragraphs

    let currentChunk = '';
    let currentWordCount = 0;
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const paragraphWords = paragraph.split(/\s+/).length;
      
      // If adding this paragraph would exceed max words, save current chunk
      if (currentWordCount + paragraphWords > options.maxWordsPerChunk && currentWordCount >= options.minWordsPerChunk) {
        chunks.push({
          content: currentChunk.trim(),
          chunkType: 'paragraph',
          index: chunkIndex++,
          wordCount: currentWordCount
        });
        
        currentChunk = paragraph;
        currentWordCount = paragraphWords;
      } else {
        // Add paragraph to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentWordCount += paragraphWords;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim() && currentWordCount >= options.minWordsPerChunk) {
      chunks.push({
        content: currentChunk.trim(),
        chunkType: 'paragraph',
        index: chunkIndex,
        wordCount: currentWordCount
      });
    }

    return chunks;
  }

  static getChunkingSummary(chunks: ChunkInfo[]): string {
    const totalWords = chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0);
    const avgWordsPerChunk = Math.round(totalWords / chunks.length);
    
    const chapterChunks = chunks.filter(c => c.chunkType === 'chapter').length;
    const sectionChunks = chunks.filter(c => c.chunkType === 'section').length;
    const paragraphChunks = chunks.filter(c => c.chunkType === 'paragraph').length;
    const automaticChunks = chunks.filter(c => c.chunkType === 'automatic').length;

    let summary = `Text aufgeteilt in ${chunks.length} Abschnitte (∅ ${avgWordsPerChunk} Wörter/Abschnitt)`;
    
    if (chapterChunks > 0) {
      summary += `. Struktur erkannt: ${chapterChunks} Kapitel`;
    } else if (sectionChunks > 0) {
      summary += `. Struktur erkannt: ${sectionChunks} Abschnitte`;
    } else if (paragraphChunks > 0) {
      summary += `. Semantische Aufteilung nach Absätzen`;
    } else {
      summary += `. Automatische Aufteilung`;
    }

    return summary;
  }
}
