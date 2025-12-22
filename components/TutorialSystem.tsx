import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MOCK_TUTORIALS } from '../constants';
import { TutorialTip } from '../types';
import { BookOpen, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

// Context Definition
interface TutorialContextType {
  showTutorial: (key: string) => Promise<'confirm' | 'cancel' | 'action'>;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

// Provider Component
export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTutorial, setActiveTutorial] = useState<TutorialTip | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: 'confirm' | 'cancel' | 'action') => void) | null>(null);

  const showTutorial = (key: string): Promise<'confirm' | 'cancel' | 'action'> => {
    const tip = MOCK_TUTORIALS.find(t => t.key === key && t.isActive);
    
    // If tutorial not found or disabled, effectively skip it (act as if user performed action)
    if (!tip) {
      return Promise.resolve('action'); 
    }

    setActiveTutorial(tip);
    
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleClose = (result: 'confirm' | 'cancel' | 'action') => {
    if (resolvePromise) {
      resolvePromise(result);
    }
    setActiveTutorial(null);
    setResolvePromise(null);
  };

  return (
    <TutorialContext.Provider value={{ showTutorial }}>
      {children}
      {activeTutorial && (
        <TutorialModal 
          tip={activeTutorial} 
          onClose={handleClose} 
        />
      )}
    </TutorialContext.Provider>
  );
};

// Modal Component
const TutorialModal: React.FC<{ tip: TutorialTip; onClose: (result: 'confirm' | 'cancel' | 'action') => void }> = ({ tip, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-white px-6 py-5 border-b border-orange-100 flex gap-4 items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-orange-100 text-orange-500">
            <BookOpen size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">{tip.title}</h3>
            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium mt-1">
              <span className="bg-orange-100 px-2 py-0.5 rounded">系統教學與提示</span>
            </div>
          </div>
          <button 
            onClick={() => onClose('cancel')}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-slate-700 leading-relaxed text-base">
            {tip.content}
          </p>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-blue-500"/>
              系統設計原則 (System Principle)
            </h4>
            <div className="text-sm text-slate-600 space-y-1 whitespace-pre-line">
              {tip.designPrinciple}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          {tip.skipText && (
            <button 
              onClick={() => onClose('confirm')} 
              className="px-4 py-2 text-slate-500 font-medium text-sm hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              {tip.skipText}
            </button>
          )}
          <button 
            onClick={() => onClose('action')} 
            className="px-6 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 shadow-md hover:shadow-lg transition transform active:scale-95"
          >
            {tip.actionText || '我了解了'}
          </button>
        </div>
      </div>
    </div>
  );
};