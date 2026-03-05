import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configuration du worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer = ({ url, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('Erreur de chargement PDF:', error);
    setError('Impossible de charger le PDF');
    setLoading(false);
  };

  const onPageLoadSuccess = () => {
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const handlePageInputChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= numPages) {
      setPageNumber(value);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const rotateLeft = () => {
    setRotation(prev => (prev - 90) % 360);
  };

  const rotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Visualiseur de partition</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 p-4">
          {error && (
            <div className="text-center">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {!error && (
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement du document...</p>
                </div>
              }
              options={{
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true,
                standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
              }}
            >
              <Page
                pageNumber={pageNumber}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-lg"
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                loading={
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Chargement de la page {pageNumber}...</p>
                  </div>
                }
              />
            </Document>
          )}
        </div>

        {/* Footer Controls */}
        {!loading && !error && numPages && (
          <div className="flex flex-wrap justify-between items-center p-4 border-t bg-gray-50 gap-4">
            {/* Navigation & Direct Page Input */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                title="Page précédente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-1 bg-white border rounded-lg px-2">
                <input
                  type="number"
                  value={pageNumber}
                  onChange={handlePageInputChange}
                  className="w-12 text-center py-1 font-medium focus:outline-none"
                  min="1"
                  max={numPages}
                />
                <span className="text-gray-400">/</span>
                <span className="text-gray-700 font-medium pr-1">{numPages}</span>
              </div>

              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                title="Page suivante"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Rotation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={rotateLeft}
                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                title="Rotation gauche"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <button
                onClick={rotateRight}
                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                title="Rotation droite"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                title="Zoom arrière"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>

              <button
                onClick={resetZoom}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium min-w-[60px]"
                title="Réinitialiser le zoom"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                onClick={zoomIn}
                disabled={scale >= 3.0}
                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                title="Zoom avant"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
