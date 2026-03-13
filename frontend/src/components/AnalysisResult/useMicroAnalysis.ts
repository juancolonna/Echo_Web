"use client";

import axios from "axios";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/utils/api";

type MicroResult = {
  jobId: string;
  status: string;
  total_readings: number;
  time_range: {
    start: string;
    end: string;
    duration_hours: number;
  };
  statistics: Record<string, any>;
  derived_metrics?: Record<string, any>;
  charts: string[];
  raw_data_sample: Record<string, any>[];
};

interface UseMicroAnalysisReturn {
  microResult: MicroResult | null;
  microJobId: string | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

// Polls for micro analysis results. Falls back to POST after ~6s if inline result is missing.
export function useMicroAnalysis(
  audioJobId: string | undefined,
  preloaded?: MicroResult | null
): UseMicroAnalysisReturn {
  const [microResult, setMicroResult] = useState<MicroResult | null>(preloaded ?? null);
  const [microJobId, setMicroJobId] = useState<string | null>(preloaded?.jobId ?? null);
  const [loading, setLoading] = useState(!preloaded && !!audioJobId);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const postTriggeredRef = useRef(false);
  const notFoundCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!audioJobId) return;
    if (preloaded) {
      setMicroResult(preloaded);
      setLoading(false);
      stopPolling();
      return;
    }
    const targetMicroJobId = `${audioJobId}_micro`;
    setMicroJobId(targetMicroJobId);
    setLoading(true);
    setError(null);
    pollCountRef.current = 0;
    postTriggeredRef.current = false;
    notFoundCountRef.current = 0;

    const check = async () => {
      pollCountRef.current++;

      try {
        const { data } = await api.get(`/analysis/analyze/${targetMicroJobId}`);

        if (data.status === "completed" && data.type === "micro") {
          setMicroResult(data);
          setLoading(false);
          stopPolling();
          return;
        }

        if (data.status === "failed") {
          setError(data.error || "Erro ao processar análise micrometeorológica");
          setLoading(false);
          stopPolling();
          return;
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          notFoundCountRef.current += 1;

          if (postTriggeredRef.current && notFoundCountRef.current >= 6) {
            setLoading(false);
            stopPolling();
            return;
          }
        }
      }

      if (pollCountRef.current >= 3 && !postTriggeredRef.current) {
        postTriggeredRef.current = true;
        try {
          await api.post(`/analysis/micro/${audioJobId}`);
        } catch {}
      }
    };

    check();
    pollingRef.current = setInterval(check, 2000);

    return () => stopPolling();
  }, [audioJobId, preloaded, stopPolling, retryCount]);

  const retry = useCallback(() => {
    setError(null);
    setMicroResult(null);
    setRetryCount((c) => c + 1);
  }, []);

  return { microResult, microJobId, loading, error, retry };
}