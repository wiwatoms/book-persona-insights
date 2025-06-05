
export interface FileProcessingResult {
  content: string;
  metadata: {
    wordCount: number;
    size: string;
    fileType: string;
  };
}

export class FileProcessor {
  static async processFile(file: File): Promise<FileProcessingResult> {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    let content: string;
    let fileType: string;

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      fileType = 'Text';
      content = await this.processTextFile(file);
    } else {
      throw new Error('UNSUPPORTED_FILE_TYPE');
    }

    if (content.trim().length < 50) {
      throw new Error('INSUFFICIENT_TEXT_CONTENT');
    }

    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

    return {
      content: content.trim(),
      metadata: {
        wordCount,
        size: `${sizeInMB} MB`,
        fileType,
      }
    };
  }

  private static async processTextFile(file: File): Promise<string> {
    try {
      return await file.text();
    } catch (error) {
      console.error('Text file processing error:', error);
      throw new Error('TEXT_PROCESSING_FAILED');
    }
  }

  static getErrorMessage(errorCode: string, fileName: string): string {
    const baseMessage = `Upload-Fehler: Wir konnten den Text aus "${fileName}" nicht extrahieren.`;
    
    switch (errorCode) {
      case 'UNSUPPORTED_FILE_TYPE':
        return `${baseMessage} Dieser Dateityp wird nicht unterstützt.\n\n**Lösung:** Bitte eine TXT-Datei verwenden. PDF-Funktionalität wurde temporär entfernt.`;
      case 'INSUFFICIENT_TEXT_CONTENT':
        return `${baseMessage} Die Datei enthält zu wenig lesbaren Text.\n\n**Lösung:** Sicherstellen, dass die Datei Text enthält.`;
      case 'TEXT_PROCESSING_FAILED':
        return `${baseMessage} Die TXT-Datei konnte nicht verarbeitet werden.\n\n**Lösung:** Bitte versuchen Sie es mit einer anderen TXT-Datei.`;
      default:
        return `${baseMessage} Ein unerwarteter Fehler ist aufgetreten.`;
    }
  }
}
