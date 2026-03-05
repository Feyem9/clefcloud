import { useState } from 'react';
import PDFViewer from '../components/PDFViewer';
import AudioPlayer from '../components/AudioPlayer';

const TestBench = () => {
    const [showPDF, setShowPDF] = useState(false);

    // URL de test pour le PDF (utilisation d'un PDF public stable)
    const testPDFUrl = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf";

    // URL de test pour l'Audio (utilisation d'un MP3 public stable)
    const testAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-primary-600 to-orange-500 bg-clip-text text-transparent">
                    Banc d'essai des composants ClefCloud
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Cette page permet de tester les fonctionnalités avancées des composants sans dépendre du backend.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Section Audio */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            Lecteur Audio Pro
                        </h2>
                        <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/20">
                            <AudioPlayer src={testAudioUrl} />
                        </div>
                        <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc pl-5 space-y-1">
                            <li>Vérifier la barre de progression</li>
                            <li>Vérifier le contrôle du volume</li>
                            <li>Vérifier l'affichage du temps (0:00 / MM:SS)</li>
                        </ul>
                    </div>

                    {/* Section PDF */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Visualiseur PDF Pro
                        </h2>
                        <button
                            onClick={() => setShowPDF(true)}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-black font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ouvrir le PDF de test
                        </button>
                        <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc pl-5 space-y-1">
                            <li>Vérifier la rotation (boutons gauche/droite)</li>
                            <li>Vérifier l'entrée manuelle du numéro de page</li>
                            <li>Vérifier le zoom %</li>
                        </ul>
                    </div>
                </div>
            </div>

            {showPDF && (
                <PDFViewer url={testPDFUrl} onClose={() => setShowPDF(false)} />
            )}
        </div>
    );
};

export default TestBench;
