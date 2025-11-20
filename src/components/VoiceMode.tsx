import { useState, useRef } from 'react';
import { Mic, Square, AlertCircle } from 'lucide-react';

interface VoiceModeProps {
  onTranscript: (text: string) => void;
  loading: boolean;
}

export function VoiceMode({ onTranscript, loading }: VoiceModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
      setTranscript('');
      transcriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text + ' ';
        } else {
          interimTranscript += text;
        }
      }

      const fullTranscript = finalTranscript + interimTranscript;
      transcriptRef.current = fullTranscript;
      setTranscript(fullTranscript);
    };

    recognition.onerror = (event: any) => {
      setError('Error: ' + event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        onTranscript(finalText);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={loading}
          className={'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ' + (
            isListening
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          ) + ' disabled:bg-gray-400 disabled:cursor-not-allowed'}
        >
          {isListening ? (
            <>
              <Square className="w-5 h-5" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Start Voice Input
            </>
          )}
        </button>
      </div>

      {isListening && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1 h-4 bg-blue-600 rounded-full animate-pulse"
                style={{ animationDelay: (i * 0.15) + 's' }}
              />
            ))}
          </div>
          <span className="text-sm text-blue-700">Listening...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {transcript && (
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Transcript:</p>
          <p className="text-sm text-gray-900">{transcript}</p>
        </div>
      )}
    </div>
  );
}
