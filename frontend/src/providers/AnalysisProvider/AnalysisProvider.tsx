'use client'

import { createContext, ReactNode, useState, useEffect } from "react";

type AudioResult = {
  filename: string;
  filepath: string;
  acoustic_richness: number;
  duration_seconds: number;
  sample_rate: number;
  num_samples: number;
  Ht: number;
  M: number;
  ACI: number;
  NDSI: number;
  BI: number;
  H: number;
  Hf: number;
  ADI: number;
};

interface IAnalysisContext {
  result: any | null;
  setResult: (result: any) => void;
  clearResult: () => void;
  isHydrated: boolean; 
}

const initialAnalysisContextData: IAnalysisContext = {
  result: null,
  setResult: () => {},
  clearResult: () => {},
  isHydrated: false 
};

export const AnalysisContext = createContext<IAnalysisContext>(initialAnalysisContextData);

export default function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false); 

  useEffect(() => {
    const saved = localStorage.getItem('analysisResult');
    if (saved) {
      setResult(JSON.parse(saved));
    }
    setIsHydrated(true); 
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (result) {
      localStorage.setItem('analysisResult', JSON.stringify(result));
    } else {
      localStorage.removeItem('analysisResult');
    }
  }, [result, isHydrated]);

  const clearResult = () => {
    setResult(null);
  };

  return (
    <AnalysisContext.Provider value={{ result, setResult, clearResult, isHydrated }}>
      {children}
    </AnalysisContext.Provider>
  );
}