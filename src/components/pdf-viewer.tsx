"use client";

import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Use the CDN for the pdf.js worker to avoid webpack/turbopack bundling issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      return (
        typeof window !== 'undefined' && 
        (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0)
      );
    };
    setIsMobile(checkMobile());
  }, []);

  useEffect(() => {
    if (!isMobile || !url) return;

    let isMounted = true;
    
    const loadPdf = async () => {
      try {
        // Intercept the local file array data buffer as requested
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const loadedPdf = await loadingTask.promise;
        
        if (isMounted) {
          setPdf(loadedPdf);
        }
      } catch (err) {
        console.error("Failed to load PDF with pdfjs", err);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [url, isMobile]);

  if (!isMobile) {
    return (
      <iframe 
        src={url} 
        className="w-full h-full border-none bg-white" 
        title="Document Viewer" 
      />
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-[#11151E] flex flex-col items-center py-4 gap-4 custom-scrollbar">
      {pdf ? (
        Array.from({ length: pdf.numPages }).map((_, i) => (
          <PdfPage key={i} pdf={pdf} pageNumber={i + 1} />
        ))
      ) : (
        <div className="text-muted-foreground animate-pulse mt-10">Rendering PDF...</div>
      )}
    </div>
  );
}

function PdfPage({ pdf, pageNumber }: { pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;
    let renderTask: any = null;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        
        // Scale for high-res displays
        const scale = window.devicePixelRatio || 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        
        if (canvas && isMounted) {
          const context = canvas.getContext('2d');
          if (!context) return;
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          canvas.style.width = '100%';
          canvas.style.maxWidth = `${viewport.width / scale}px`;
          canvas.style.height = 'auto';

          renderTask = page.render({
            canvasContext: context,
            viewport: viewport
          } as any);
          
          await renderTask.promise;
        }
      } catch (err) {
        // Render cancelled or failed silently
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdf, pageNumber]);

  return (
    <div className="bg-white rounded-sm shadow-md overflow-hidden flex-shrink-0 w-[95%] max-w-4xl">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}
