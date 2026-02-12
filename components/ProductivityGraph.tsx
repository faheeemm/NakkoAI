'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoryEntry {
  date: string;
  score: number;
  feedback: string;
}

interface ProductivityGraphProps {
  data: HistoryEntry[];
}

export default function ProductivityGraph({ data }: ProductivityGraphProps) {
  // Prepare data for chart - take last 14 days
  const chartData = [...data]
    .reverse()
    .slice(0, 14)
    .map((entry) => {
      // Handle date parsing safely
      const dateStr = entry.date;
      let formattedDate = dateStr;
      
      try {
        const [year, month, day] = dateStr.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch {
        // Fallback if parsing fails
        formattedDate = dateStr;
      }

      return {
        date: formattedDate,
        score: entry.score,
        fullDate: entry.date,
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="border border-dashed border-neutral-700 rounded-lg p-8 flex items-center justify-center h-full bg-neutral-950">
        <p className="text-neutral-500 font-mono text-sm text-center">Submit your first entry to see your productivity trend</p>
      </div>
    );
  }

  return (
    <div className="border border-neutral-700 rounded-lg p-6 bg-neutral-900 h-full flex flex-col shadow-lg">
      <h3 className="text-neutral-300 font-mono text-sm mb-4">productivity trend (last 14 days)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" horizontal={true} vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#737373"
              style={{ fontSize: '11px', fontFamily: 'monospace' }}
              tick={{ fill: '#a3a3a3' }}
            />
            <YAxis
              domain={[0, 10]}
              stroke="#737373"
              style={{ fontSize: '11px', fontFamily: 'monospace' }}
              tick={{ fill: '#a3a3a3' }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #404040',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: '#e5e5e5', fontSize: '12px' }}
              formatter={(value) => [value, 'score']}
              cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6, fill: '#60a5fa' }}
              strokeWidth={2.5}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
