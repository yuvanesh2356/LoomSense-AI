import { useCallback, useEffect, useRef, useState } from "react";

// Minimal ambient types for the (non-standardized) Web Speech API so this
// compiles without an extra @types package.
interface MinimalSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => MinimalSpeechRecognition;
    webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
  }
}

const LANG_CODES: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
};

/**
 * Wraps the browser's native Web Speech API (SpeechRecognition +
 * speechSynthesis) — zero npm dependency, zero API key. Voice recognition
 * quality for Hindi/Tamil varies by browser/OS (best on Chrome); this
 * degrades gracefully (`supported` flips false) rather than pretending to
 * work everywhere.
 */
export function useVoice(language: string = "en") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  const RecognitionCtor =
    typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;
  const supported = Boolean(RecognitionCtor) && typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!RecognitionCtor) return;
    const recognition = new RecognitionCtor();
    recognition.lang = LANG_CODES[language] ?? "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript ?? "";
      setTranscript(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
    };
  }, [language, RecognitionCtor]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setListening(true);
    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_CODES[language] ?? "en-IN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [language]
  );

  return { supported, listening, transcript, startListening, stopListening, speak };
}