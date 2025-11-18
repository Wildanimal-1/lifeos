import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  loading: boolean;
}

export function CommandInput({ onSubmit, loading }: CommandInputProps) {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !loading) {
      onSubmit(command.trim());
    }
  };

  const exampleCommands = [
    'Plan my week: reply to urgent emails, reschedule low-priority meetings, and create a study plan for my ML midterm',
    'Triage my inbox and draft replies for urgent emails',
    'Reschedule low-priority calendar events to create focused work blocks',
    'Create a study plan for my ML midterm exam'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter your command (e.g., 'Plan my week...')"
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !command.trim()}
          className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>

      <div className="mt-4">
        <p className="text-sm text-gray-600 mb-2">Example commands:</p>
        <div className="space-y-2">
          {exampleCommands.map((example, idx) => (
            <button
              key={idx}
              onClick={() => setCommand(example)}
              className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
