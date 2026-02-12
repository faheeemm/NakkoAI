'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ProductivityInputProps {
  onAnalyze: (score: number, feedback: string, date: string, prompt: string) => void;
  onLoading: (loading: boolean) => void;
}

export default function ProductivityInput({ onAnalyze, onLoading }: ProductivityInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    setIsLoading(true);
    onLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze');
      }

      const data = await response.json();
      onAnalyze(data.score, data.feedback, data.date, prompt);
      setPrompt('');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to analyze productivity. Please try again.');
    } finally {
      setIsLoading(false);
      onLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800 shadow-lg">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you accomplished today, any challenges faced, and what you're working on..."
          className="w-full h-40 bg-neutral-900 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 text-sm leading-relaxed font-mono resize-none rounded p-4 border border-neutral-700 transition-colors"
          disabled={isLoading}
        />
        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-neutral-500 font-mono">{prompt.length} characters</p>
          <Button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-sm px-6 py-2 rounded transition-colors"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </div>
    </form>
  );
}
