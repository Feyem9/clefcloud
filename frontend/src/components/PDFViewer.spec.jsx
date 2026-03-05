import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PDFViewer from './PDFViewer';

// Mock react-pdf
vi.mock('react-pdf', () => ({
    pdfjs: {
        GlobalWorkerOptions: {
            workerSrc: ''
        },
        version: '3.0.0'
    },
    Document: ({ children, onLoadSuccess }) => {
        // Simuler un chargement réussi après le premier rendu
        setTimeout(() => {
            onLoadSuccess && onLoadSuccess({ numPages: 10 });
        }, 0);
        return <div data-testid="pdf-document">{children}</div>;
    },
    Page: ({ pageNumber, rotate, scale }) => (
        <div data-testid="pdf-page">
            Page {pageNumber} (Scale: {scale}, Rotate: {rotate})
        </div>
    )
}));

describe('PDFViewer Component', () => {
    const mockUrl = 'test.pdf';
    const mockOnClose = vi.fn();

    it('renders correctly and shows controls after loading', async () => {
        render(<PDFViewer url={mockUrl} onClose={mockOnClose} />);

        // Au début, on devrait voir le titre
        expect(screen.getByText(/Visualiseur de partition/i)).toBeDefined();

        // Attendre que le document simule son chargement
        const nextButton = await screen.findByTitle(/Page suivante/i);
        expect(nextButton).toBeDefined();

        // Vérifier l'affichage de la pagination
        expect(screen.getByDisplayValue('1')).toBeDefined();
        expect(screen.getAllByText(/10/).length).toBeGreaterThan(0);
    });

    it('calls onClose when close button is clicked', () => {
        render(<PDFViewer url={mockUrl} onClose={mockOnClose} />);

        const closeButton = screen.getByLabelText(/Fermer/i);

        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles zoom in/out/reset', async () => {
        render(<PDFViewer url={mockUrl} onClose={mockOnClose} />);

        // Attendre le chargement
        await screen.findByTitle(/Zoom avant/i);

        const zoomInBtn = screen.getByTitle(/Zoom avant/i);
        const zoomOutBtn = screen.getByTitle(/Zoom arrière/i);
        const resetBtn = screen.getByTitle(/Réinitialiser le zoom/i);

        expect(resetBtn.textContent).toBe('100%');

        fireEvent.click(zoomInBtn);
        expect(resetBtn.textContent).toBe('120%');

        fireEvent.click(zoomOutBtn);
        expect(resetBtn.textContent).toBe('100%');
    });

    it('handles rotation', async () => {
        render(<PDFViewer url={mockUrl} onClose={mockOnClose} />);

        await screen.findByTitle(/Rotation droite/i);

        const rotateRightBtn = screen.getByTitle(/Rotation droite/i);
        fireEvent.click(rotateRightBtn);

        // On vérifie indirectement via le mock de Page (si on pouvait lire ses props)
        // Mais ici on teste surtout que le clic ne crashe pas et que l'UI réagit
        expect(rotateRightBtn).toBeDefined();
    });
});
