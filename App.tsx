
import React, { Suspense, lazy, ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { TutorialProvider } from './TutorialSystem';
import { RefreshCw, AlertTriangle } from 'lucide-react';

// Lazy Load Components from Root
const WarRoom = lazy(() => import('./WarRoom').then(module => ({ default: module.WarRoom })));
const VendorDirectory = lazy(() => import('./VendorDirectory').then(module => ({ default: module.VendorDirectory })));
const VendorDetail = lazy(() => import('./VendorDetail').then(module => ({ default: module.VendorDetail })));
const Announcements = lazy(() => import('./Announcements').then(module => ({ default: module.Announcements })));
const TransactionDetail = lazy(() => import('./TransactionDetail').then(module => ({ default: module.TransactionDetail })));
const Payments = lazy(() => import('./Payments').then(module => ({ default: module.Payments })));
const Admin = lazy(() => import('./Admin').then(module => ({ default: module.Admin })));
const Tasks = lazy(() => import('./Tasks').then(module => ({ default: module.Tasks })));
const CommunicationHub = lazy(() => import('./CommunicationHub').then(module => ({ default: module.CommunicationHub })));
const KnowledgeBase = lazy(() => import('./KnowledgeBase').then(module => ({ default: module.KnowledgeBase })));

// Loading Component
const LoadingFallback = () => (
  <div className="h-full flex flex-col items-center justify-center text-slate-400">
    <RefreshCw className="animate-spin mb-2" size={32} />
    <p>系統載入中...</p>
  </div>
);

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-md">
            <div className="inline-flex p-4 bg-red-100 text-red-600 rounded-full mb-4">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">系統發生錯誤</h1>
            <p className="text-sm text-slate-500 mb-6">很抱歉，應用程式遇到未預期的錯誤。請嘗試重新整理頁面。</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-bold"
            >
              重新整理
            </button>
          </div>
        </div>
      );
    }

    return this.props.children || null;
  }
}

const App: React.FC = () => {
  return (
    <Router>
      <ErrorBoundary>
        <TutorialProvider>
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<WarRoom />} />
                <Route path="/vendors" element={<VendorDirectory />} />
                <Route path="/vendors/:id" element={<VendorDetail />} />
                <Route path="/transactions/:id" element={<TransactionDetail />} />
                <Route path="/communication" element={<CommunicationHub />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/announcements" element={<Announcements />} />
                
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="/admin" element={<Admin />} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </TutorialProvider>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
