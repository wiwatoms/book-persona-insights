
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PdfUploaderProps {
  onPdfUploaded: (content: string) => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({ onPdfUploaded }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<{
    pages: number;
    wordCount: number;
    size: string;
  } | null>(null);
  
  const { toast } = useToast();

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      // Use a more reliable PDF.js setup
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source to a more reliable CDN
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      
      setUploadProgress(20);
      
      const arrayBuffer = await file.arrayBuffer();
      setUploadProgress(40);
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setUploadProgress(60);
      
      let fullText = '';
      const totalPages = pdf.numPages;
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += pageText + '\n\n';
          setUploadProgress(60 + (pageNum / totalPages) * 30);
        } catch (pageError) {
          console.warn(`Warning: Could not extract text from page ${pageNum}:`, pageError);
          // Continue with other pages instead of failing completely
        }
      }
      
      setUploadProgress(95);
      
      // Calculate statistics
      const wordCount = fullText.trim().split(/\s+/).filter(word => word.length > 0).length;
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      
      setExtractedInfo({
        pages: totalPages,
        wordCount,
        size: `${sizeInMB} MB`
      });
      
      setUploadProgress(100);
      
      if (fullText.trim().length < 100) {
        throw new Error('INSUFFICIENT_TEXT_CONTENT');
      }
      
      return fullText.trim();
      
    } catch (error) {
      console.error('PDF processing error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('password') || error.message.includes('encrypted')) {
          throw new Error('PASSWORD_PROTECTED');
        } else if (error.message.includes('INSUFFICIENT_TEXT_CONTENT')) {
          throw new Error('INSUFFICIENT_TEXT_CONTENT');
        } else if (error.message.includes('InvalidPDFException') || error.message.includes('UnexpectedResponseException')) {
          throw new Error('CORRUPTED_PDF');
        }
      }
      
      throw new Error('EXTRACTION_FAILED_TECHNICAL');
    }
  };

  const getErrorMessage = (errorCode: string, fileName: string): string => {
    const baseMessage = `Upload Failed: We couldn't extract text from "${fileName}".`;
    
    switch (errorCode) {
      case 'PASSWORD_PROTECTED':
        return `${baseMessage} This PDF appears to be password-protected.

**To resolve this:**
1. Remove the password protection from the PDF
2. Re-save the PDF without encryption
3. Try uploading again`;

      case 'INSUFFICIENT_TEXT_CONTENT':
        return `${baseMessage} This PDF appears to contain mostly images or very little extractable text.

**To resolve this:**
1. If this is a scanned document, use an OCR tool to convert it to searchable text
2. Try online OCR services like "SmallPDF OCR" or "Adobe Acrobat Online"
3. Ensure the PDF contains selectable text (not just images)
4. Upload a text-based PDF instead`;

      case 'CORRUPTED_PDF':
        return `${baseMessage} The PDF file appears to be corrupted or in an unsupported format.

**To resolve this:**
1. Try re-downloading the original PDF
2. Re-save the PDF from its source (Word, Google Docs, etc.)
3. Try opening the PDF in a different viewer to verify it works
4. Convert the file to PDF again if possible`;

      case 'EXTRACTION_FAILED_TECHNICAL':
      default:
        return `${baseMessage} This often happens with complex formatting, scanned documents, or protected PDFs.

**To resolve this, please try:**
1. **For scanned documents:** Use an OCR tool to make the text searchable
2. **For protected PDFs:** Remove password protection or restrictions
3. **For complex layouts:** Re-save from the original source (Word, Google Docs)
4. **For large files:** Try a smaller section or simplified version
5. **Alternative:** Copy the text manually and paste it into a new document, then save as PDF

**Recommended OCR tools:** SmallPDF, Adobe Acrobat Online, or search "free OCR PDF" for online options.`;
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Bitte wählen Sie eine gültige PDF-Datei aus.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('Die Datei ist zu groß. Bitte verwenden Sie eine PDF-Datei unter 50MB.');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setError(null);
    setExtractedInfo(null);

    console.log('Starting file processing:', file.name, file.type, file.size);

    try {
      setUploadProgress(10);
      const extractedText = await extractTextFromPdf(file);
      
      if (extractedText.length < 100) {
        throw new Error('INSUFFICIENT_TEXT_CONTENT');
      }

      console.log(`Successfully extracted ${extractedText.length} characters from PDF`);
      
      toast({
        title: "PDF erfolgreich verarbeitet",
        description: `${extractedInfo?.wordCount || 'Unknown'} Wörter aus ${extractedInfo?.pages || 'Unknown'} Seiten extrahiert`,
      });

      onPdfUploaded(extractedText);
      
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'EXTRACTION_FAILED_TECHNICAL';
      const errorMessage = getErrorMessage(errorCode, file.name);
      
      console.error('Upload error:', error);
      setError(errorMessage);
      
      toast({
        title: "Upload-Fehler",
        description: "PDF konnte nicht verarbeitet werden. Siehe Details unten.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    } else {
      setError('Bitte wählen Sie eine PDF-Datei aus.');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card 
        className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                PDF-Manuskript hochladen
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Ziehen Sie Ihre PDF-Datei hierher oder klicken Sie zum Auswählen
              </p>
              
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="pdf-upload"
                disabled={isProcessing}
              />
              
              <Button 
                asChild 
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Datei auswählen
                </label>
              </Button>
            </div>
            
            <p className="text-xs text-slate-500">
              Unterstützte Formate: PDF (max. 50MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">PDF wird verarbeitet...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-blue-600">
                {uploadProgress < 20 && "Datei wird geladen..."}
                {uploadProgress >= 20 && uploadProgress < 40 && "PDF wird analysiert..."}
                {uploadProgress >= 40 && uploadProgress < 60 && "Text wird extrahiert..."}
                {uploadProgress >= 60 && uploadProgress < 95 && "Seiten werden verarbeitet..."}
                {uploadProgress >= 95 && "Fertigstellung..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Info */}
      {extractedInfo && !isProcessing && !error && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Erfolgreich verarbeitet:</strong> {extractedInfo.pages} Seiten, {extractedInfo.wordCount} Wörter ({extractedInfo.size})
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="text-left">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="whitespace-pre-line">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Help Information */}
      <Alert className="bg-slate-50 border-slate-200">
        <Info className="h-4 w-4 text-slate-600" />
        <AlertDescription className="text-slate-700">
          <strong>Tipp:</strong> Für beste Ergebnisse verwenden Sie text-basierte PDFs (keine gescannten Bilder). 
          Bei Problemen prüfen Sie, ob das PDF Passwort-geschützt ist oder versuchen Sie es erneut zu speichern.
        </AlertDescription>
      </Alert>
    </div>
  );
};
