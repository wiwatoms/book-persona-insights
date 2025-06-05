
export interface FileProcessingResult {
  content: string;
  metadata: {
    pages?: number;
    wordCount: number;
    size: string;
    fileType: string;
  };
}

export class FileProcessor {
  static async processFile(file: File): Promise<FileProcessingResult> {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    
    let content: string;
    let pages: number | undefined;
    
    if (file.type === 'application/pdf') {
      content = await this.processPDF(file);
      // For PDF, estimate pages based on content length (rough approximation)
      pages = Math.max(1, Math.ceil(content.length / 2000));
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
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
        pages,
        wordCount,
        size: `${sizeInMB} MB`,
        fileType: file.type === 'application/pdf' ? 'PDF' : 'Text'
      }
    };
  }
  
  private static async processPDF(file: File): Promise<string> {
    try {
      // Use pdf-parse library which is already installed
      const pdfParse = await import('pdf-parse');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      const data = await pdfParse.default(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF processing error:', error);
      throw new Error('PDF_PROCESSING_FAILED');
    }
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
        return `${baseMessage} Dieser Dateityp wird nicht unterstützt.

**Unterstützte Formate:**
- PDF-Dateien (.pdf)
- Textdateien (.txt)

**Lösung:** Bitte konvertieren Sie Ihre Datei in eines der unterstützten Formate.`;

      case 'INSUFFICIENT_TEXT_CONTENT':
        return `${baseMessage} Die Datei enthält zu wenig lesbaren Text.

**Mögliche Ursachen:**
- Gescannte PDF ohne OCR
- Leere oder fast leere Datei
- Datei enthält hauptsächlich Bilder

**Lösungen:**
1. Für gescannte PDFs: OCR-Tool verwenden
2. Textinhalt direkt kopieren und als .txt-Datei speichern
3. Dokument aus der Originalquelle (Word, Google Docs) als PDF exportieren`;

      case 'PDF_PROCESSING_FAILED':
        return `${baseMessage} PDF konnte nicht verarbeitet werden.

**Mögliche Ursachen:**
- Passwort-geschützte PDF
- Beschädigte PDF-Datei
- Komplexe Formatierung

**Lösungen:**
1. **Passwort entfernen:** PDF ohne Schutz speichern
2. **Als Text speichern:** Text kopieren und als .txt-Datei speichern
3. **Neu exportieren:** Dokument aus Originalquelle neu als PDF speichern`;

      case 'TEXT_PROCESSING_FAILED':
        return `${baseMessage} Textdatei konnte nicht gelesen werden.

**Lösungen:**
1. Datei in UTF-8 Kodierung speichern
2. Sicherstellen, dass die Datei nicht beschädigt ist
3. Als neue .txt-Datei speichern`;

      default:
        return `${baseMessage} Ein unerwarteter Fehler ist aufgetreten.

**Allgemeine Lösungen:**
1. **Textdatei verwenden:** Text kopieren und als .txt-Datei speichern
2. **PDF neu erstellen:** Dokument aus Originalquelle neu exportieren
3. **Kleinere Datei:** Dokument aufteilen, falls sehr groß`;
    }
  }
}
