'use client';

interface HistoryEntry {
  date: string;
  score: number;
  feedback: string;
}

interface ProductivityScoreProps {
  score: number;
  feedback: string;
  date: string;
  history: HistoryEntry[];
}

export default function ProductivityScore({ score, feedback, date, history }: ProductivityScoreProps) {
  // Get previous day's score for comparison
  const previousScore = history.length > 1 ? history[1].score : null;
  const comparison = previousScore ? score - previousScore : 0;

  // Format date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getComparisonText = () => {
    if (comparison === 0) return 'same as yesterday';
    if (comparison > 0) return `↑ +${comparison} from yesterday`;
    return `↓ ${comparison} from yesterday`;
  };

  const getComparisonColor = () => {
    if (comparison === 0) return 'text-neutral-400';
    if (comparison > 0) return 'text-green-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-850 border border-neutral-700 rounded-lg p-6 shadow-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest">{formatDate(date)}</p>
          {previousScore !== null && (
            <p className={`text-xs font-mono ${getComparisonColor()}`}>
              {getComparisonText()}
            </p>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-7xl font-light text-blue-400">{score}</span>
          <span className="text-neutral-400 text-xl font-mono">/10</span>
        </div>

        <div className="border-t border-neutral-700 pt-4">
          <p className="text-sm font-mono leading-relaxed text-neutral-300">
            {feedback}
          </p>
        </div>
      </div>
    </div>
  );
}
