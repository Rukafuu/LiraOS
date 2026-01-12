import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import '../i18n';
import { TraePanel } from '../components/TraePanel';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

console.log('[L.A.P] Standalone Mode Initialized');

const LAPStandalone = () => {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <ToastProvider>
                    <div className="fixed inset-0 bg-[#0a0a0a]">
                        <TraePanel onClose={() => window.close()} />
                    </div>
                </ToastProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
};

const rootElement = document.getElementById('lap-root');
if (!rootElement) {
    throw new Error('Could not find lap-root element');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <LAPStandalone />
    </React.StrictMode>
);
