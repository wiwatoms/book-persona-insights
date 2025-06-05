import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';

interface PdfUploaderProps {
  onPdfUploaded: (content: string) => void;
}

interface ExtractionResult {
  content: string;
  hasWarnings: boolean;
  warnings: string[];
  extractionMethod: string;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({ onPdfUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const { toast } = useToast();

  const analyzeTextQuality = (text: string): { hasWarnings: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    
    // Check for potential OCR artifacts
    const specialCharRatio = (text.match(/[^\w\s.,;:!?'"()-]/g) || []).length / text.length;
    if (specialCharRatio > 0.05) {
      warnings.push("Text contains many unusual characters - may indicate scanning artifacts");
    }
    
    // Check for very short lines (potential formatting issues)
    const lines = text.split('\n');
    const shortLines = lines.filter(line => line.trim().length > 0 && line.trim().length < 10).length;
    if (shortLines / lines.length > 0.3) {
      warnings.push("Many very short text lines detected - may indicate formatting issues");
    }
    
    // Check for repeated characters (common in poorly extracted PDFs)
    if (text.match(/(.)\1{5,}/g)) {
      warnings.push("Repeated character sequences detected - extraction may be incomplete");
    }
    
    return {
      hasWarnings: warnings.length > 0,
      warnings
    };
  };

  const extractTextFromPdf = async (file: File): Promise<ExtractionResult> => {
    if (file.type === 'text/plain') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          const quality = analyzeTextQuality(content);
          resolve({
            content,
            hasWarnings: quality.hasWarnings,
            warnings: quality.warnings,
            extractionMethod: 'Direct text file'
          });
        };
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      });
    }

    if (file.type === 'application/pdf') {
      // Set up the worker when we actually need it
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        const totalPages = pdf.numPages;
        let extractionWarnings: string[] = [];

        // First extraction attempt - standard method
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          setUploadProgress((pageNum / totalPages) * 80); // 80% for PDF processing
          
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Enhanced text extraction with better spacing
          const pageText = textContent.items
            .map((item: any) => {
              // Check if this item has positioning info for better spacing
              if (item.transform && item.width) {
                return item.str;
              }
              return item.str;
            })
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (pageText.length < 10 && pageNum <= 3) {
            extractionWarnings.push(`Page ${pageNum} contains very little text`);
          }
          
          fullText += pageText + '\n\n';
        }

        setUploadProgress(90);

        // Analyze extraction quality
        const quality = analyzeTextQuality(fullText);
        const allWarnings = [...extractionWarnings, ...quality.warnings];

        if (fullText.trim().length < 50) {
          throw new Error('INSUFFICIENT_TEXT');
        }

        return {
          content: fullText.trim(),
          hasWarnings: allWarnings.length > 0,
          warnings: allWarnings,
          extractionMethod: 'PDF.js standard extraction'
        };

      } catch (error) {
        console.error('PDF processing error:', error);
        
        if (error instanceof Error && error.message === 'INSUFFICIENT_TEXT') {
          throw new Error('EXTRACTION_FAILED_INSUFFICIENT');
        }
        
        throw new Error('EXTRACTION_FAILED_TECHNICAL');
      }
    }

    throw new Error('UNSUPPORTED_FILE_TYPE');
  };

  const getErrorGuidance = (errorCode: string, fileName: string): React.ReactNode => {
    switch (errorCode) {
      case 'EXTRACTION_FAILED_INSUFFICIENT':
        return (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Upload Failed:</strong> We couldn't extract readable text from "{fileName}". 
                This often happens with image-only PDFs, password-protected files, or unusual formatting.
              </AlertDescription>
            </Alert>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-800 mb-2">To resolve this issue, please try:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                  <li>Ensure the PDF is not password-protected for text extraction</li>
                  <li><strong>For scanned documents:</strong> Use an OCR tool to convert it into a text-searchable PDF 
                      (search online for "free OCR to PDF" tools)</li>
                  <li>Try re-saving the PDF from its original source (Word, Google Docs, etc.)</li>
                  <li>If the file is very large or complex, try a smaller or simplified version</li>
                  <li>Verify the PDF actually contains text (not just images)</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'EXTRACTION_FAILED_TECHNICAL':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Technical Error:</strong> Failed to process "{fileName}". The file may be corrupted, 
              encrypted, or in an unsupported PDF format. Please try re-saving the file or use a different PDF.
            </AlertDescription>
          </Alert>
        );
      
      case 'UNSUPPORTED_FILE_TYPE':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Unsupported File Type:</strong> Please upload a PDF or text file (.pdf, .txt).
            </AlertDescription>
          </Alert>
        );
      
      default:
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              An unexpected error occurred while processing "{fileName}". Please try again with a different file.
            </AlertDescription>
          </Alert>
        );
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf') && !file.type.includes('text')) {
      setExtractionResult({
        content: '',
        hasWarnings: false,
        warnings: [],
        extractionMethod: 'Error'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Datei zu groß",
        description: "Die Datei darf maximal 10 MB groß sein.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setUploadedFile(file);
    setExtractionResult(null);

    try {
      console.log('Starting file processing:', file.name, file.type, file.size);
      
      const result = await extractTextFromPdf(file);
      setUploadProgress(100);
      
      console.log('Extracted text length:', result.content.length);
      console.log('Extraction method:', result.extractionMethod);
      console.log('Warnings:', result.warnings);
      
      setExtractedText(result.content);
      setExtractionResult(result);
      
      if (result.hasWarnings) {
        toast({
          title: "Upload erfolgreich mit Hinweisen",
          description: `${file.name} wurde verarbeitet, aber es gibt ${result.warnings.length} Hinweise zur Textqualität.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Upload erfolgreich",
          description: `${file.name} wurde erfolgreich verarbeitet. ${result.content.length} Zeichen extrahiert.`,
        });
      }

      onPdfUploaded(result.content);
    } catch (error) {
      console.error('Upload error:', error);
      const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      setExtractionResult({
        content: '',
        hasWarnings: false,
        warnings: [],
        extractionMethod: 'Error: ' + errorCode
      });
      setUploadedFile(file); // Keep file for error display
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Show error guidance if extraction failed
  if (uploadedFile && extractionResult && extractionResult.extractionMethod.startsWith('Error:')) {
    const errorCode = extractionResult.extractionMethod.replace('Error: ', '');
    return (
      <div className="space-y-4">
        {getErrorGuidance(errorCode, uploadedFile.name)}
        <Button 
          variant="outline" 
          onClick={() => {
            setUploadedFile(null);
            setExtractionResult(null);
            setExtractedText('');
          }}
        >
          Andere Datei versuchen
        </Button>
      </div>
    );
  }

  // Show success state with warnings if applicable
  if (uploadedFile && !isProcessing && extractedText && extractionResult) {
    return (
      <Card className={extractionResult.hasWarnings ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {extractionResult.hasWarnings ? (
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${extractionResult.hasWarnings ? 'text-orange-800' : 'text-green-800'}`}>
                Datei erfolgreich verarbeitet
                {extractionResult.hasWarnings && ' (mit Hinweisen)'}
              </h3>
              <p className={extractionResult.hasWarnings ? 'text-orange-600' : 'text-green-600'}>
                {uploadedFile.name}
              </p>
              <p className={`text-sm ${extractionResult.hasWarnings ? 'text-orange-500' : 'text-green-500'}`}>
                {extractedText.length} Zeichen extrahiert • {extractionResult.extractionMethod}
              </p>
            </div>
          </div>

          {extractionResult.hasWarnings && (
            <Alert className="mb-4 bg-orange-100 border-orange-300">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Qualitätshinweise:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {extractionResult.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm">{warning}</li>
                  ))}
                </ul>
                <p className="text-sm mt-2">
                  Sie können trotzdem fortfahren, aber die Analyseergebnisse könnten beeinträchtigt sein.
                </p>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-white p-4 rounded border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Textvorschau:</h4>
            <p className="text-sm text-slate-700 italic leading-relaxed max-h-40 overflow-y-auto">
              {extractedText.substring(0, 500)}...
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setUploadedFile(null);
              setExtractedText('');
              setExtractionResult(null);
            }}
          >
            Andere Datei hochladen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card
        className={`border-2 border-dashed transition-all ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Buchmanuskript hochladen
              </h3>
              <p className="text-slate-600 mb-4">
                Ziehen Sie Ihre PDF-Datei hierher oder klicken Sie zum Auswählen
              </p>
              <Button 
                variant="outline" 
                className="relative"
                disabled={isProcessing}
              >
                <FileText className="w-4 h-4 mr-2" />
                Datei auswählen
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <h4 className="font-medium">Datei wird verarbeitet...</h4>
                  <p className="text-sm text-slate-600">
                    Text wird extrahiert und für die Analyse vorbereitet
                  </p>
                </div>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-slate-500">
                {uploadProgress < 80 ? 'PDF wird verarbeitet...' : 
                 uploadProgress < 90 ? 'Textqualität wird analysiert...' : 'Finalisierung...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-slate-500 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium mb-1">Hinweise:</p>
              <ul className="space-y-1 text-xs">
                <li>• Unterstützte Formate: PDF (mit Text), TXT</li>
                <li>• Maximale Dateigröße: 10 MB</li>
                <li>• Für beste Ergebnisse mindestens 1000 Wörter</li>
                <li>• PDF muss selektierbaren Text enthalten (keine reinen Bilder)</li>
                <li>• Bei gescannten Dokumenten nutzen Sie OCR-Tools vor dem Upload</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
