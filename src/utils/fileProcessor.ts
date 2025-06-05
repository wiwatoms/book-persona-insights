
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    let fileType: string;

    if (file.type === 'application/pdf') {
      fileType = 'PDF';
      const pdfData = await this.processPDF(file);
      content = pdfData.text;
      pages = pdfData.numPages;
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
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
        pages,
        wordCount,
        size: `${sizeInMB} MB`,
        fileType,
      }
    };
  }

  private static async processPDF(file: File): Promise<{ text: string; numPages: number }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let fullText = '';

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n\n';
        } catch (pageError) {
          console.warn(`Could not extract text from page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }

      if (fullText.trim().length < 50) {
        throw new Error('INSUFFICIENT_TEXT_CONTENT');
      }

      return { text: fullText.trim(), numPages };
    } catch (error) {
      console.error('PDF processing error:', error);
      if (error instanceof Error) {
        if (error.message.includes('password') || error.message.includes('encrypted')) {
          throw new Error('PASSWORD_PROTECTED');
        } else if (error.message.includes('INSUFFICIENT_TEXT_CONTENT')) {
          throw new Error('INSUFFICIENT_TEXT_CONTENT');
        }
      }
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
        return `${baseMessage} Dieser Dateityp wird nicht unterstützt.\n\n**Lösung:** Bitte eine PDF- oder TXT-Datei verwenden.`;
      case 'INSUFFICIENT_TEXT_CONTENT':
        return `${baseMessage} Die Datei enthält zu wenig lesbaren Text.\n\n**Lösung:** Sicherstellen, dass die Datei Text enthält und nicht nur Bilder.`;
      case 'PASSWORD_PROTECTED':
        return `${baseMessage} Das PDF ist Passwort-geschützt.\n\n**Lösung:** Bitte den Schutz entfernen und erneut hochladen.`;
      case 'PDF_PROCESSING_FAILED':
        return `${baseMessage} Das PDF konnte nicht verarbeitet werden.\n\n**Mögliche Ursachen:**\n- Komplexes Format oder Beschädigung\n- Gescannte Bilder ohne Text (OCR erforderlich)\n\n**Lösung:** Versuchen Sie, den Text zu kopieren und als TXT-Datei zu speichern.`;
      default:
        return `${baseMessage} Ein unerwarteter Fehler ist aufgetreten.`;
    }
  }
}
