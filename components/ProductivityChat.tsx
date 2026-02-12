'use client';

interface HistoryEntry {
  date: string;
  score: number;
  feedback: string;
  prompt: string;
}

interface ProductivityChatProps {
  data: HistoryEntry[];
  currentScore?: {
    score: number;
    feedback: string;
    date: string;
    prompt: string;
  } | null;
}

export default function ProductivityChat({ data, currentScore }: ProductivityChatProps) {
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 8) return '🔥';
    if (score >= 6) return '✨';
    if (score >= 4) return '💭';
    return '⚠️';
  };

  const allEntries = currentScore ? [{ ...currentScore, prompt: currentScore.prompt }, ...data] : data;

  if (allEntries.length === 0) {
    return (
      <div className="border border-dashed border-neutral-700 rounded-lg p-8 flex items-center justify-center h-full bg-neutral-950">
        <p className="text-neutral-500 font-mono text-sm text-center">No entries yet. Start by submitting your first productivity entry.</p>
      </div>
    );
  }

  return (
    <div className="border border-neutral-700 rounded-lg bg-neutral-900 h-full flex flex-col shadow-lg overflow-hidden">
      <div className="p-4 border-b border-neutral-700">
        <h3 className="text-neutral-300 font-mono text-sm">conversation history</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {allEntries.map((entry, index) => (
          <div key={`${entry.date}-${index}`} className="space-y-2">
            {/* Your message */}
            <div className="flex justify-end">
              <div className="max-w-xs bg-blue-900 border border-blue-700 rounded-lg p-3">
                <p className="text-xs text-neutral-400 font-mono mb-1">{formatDate(entry.date)}</p>
                <p className="text-sm text-neutral-100 font-mono leading-relaxed">{entry.prompt}</p>
              </div>
            </div>

            {/* AI Response */}
            <div className="flex justify-start">
              <div className="max-w-xs bg-neutral-800 border border-neutral-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getScoreEmoji(entry.score)}</span>
                  <span className="text-2xl font-light text-blue-400">{entry.score}</span>
                  <span className="text-xs text-neutral-500 font-mono">/10</span>
                </div>
                <p className="text-sm text-neutral-300 font-mono leading-relaxed">{entry.feedback}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
