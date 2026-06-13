'use client';

import { useState, useEffect, useCallback } from 'react';

// Extend window for Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

export function useVoiceInput() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        
        rec.onstart = () => setState('listening');
        rec.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };
        rec.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setState('error');
          setTimeout(() => setState('idle'), 3000);
        };
        rec.onend = () => {
          if (state === 'listening') {
            setState('processing');
            // Simulate processing time
            setTimeout(() => setState('idle'), 1000);
          }
        };

        setRecognition(rec);
      } else {
        setIsSupported(false);
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      setTranscript('');
      try {
        recognition.start();
      } catch (e) {
        // Already started
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  const toggleListening = useCallback(() => {
    if (state === 'listening') stopListening();
    else startListening();
  }, [state, startListening, stopListening]);

  return {
    state,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    setTranscript // allow manual override
  };
}
