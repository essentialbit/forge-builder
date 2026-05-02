'use client';

import { Lightbulb, ArrowRight, X, Zap, Search, Accessibility, Gauge, ShoppingCart, FileText } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AutoSuggestion } from '@/lib/ai/types';

const TYPE_ICONS: Record<string, React.ElementType> = {
  'add-section': Zap,
  'update-setting': FileText,
  seo: Search,
  accessibility: Accessibility,
  performance: Gauge,
  conversion: ShoppingCart,
  content: Lightbulb,
};

const PRIORITY_COLORS = {
  high: 'border-l-orange-500',
  medium: 'border-l-amber-500',
  low: 'border-l-slate-600',
};

const PRIORITY_BADGE = {
  high: 'bg-orange-900/50 text-orange-300',
  medium: 'bg-amber-900/50 text-amber-300',
  low: 'bg-slate-700 text-slate-400',
};

interface SuggestionCardsProps {
  suggestions: AutoSuggestion[];
  onAction?: (suggestion: AutoSuggestion) => void;
}

export function SuggestionCards({ suggestions, onAction }: SuggestionCardsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-500">
        <Lightbulb className="w-6 h-6" />
        <p className="text-xs">No suggestions right now — your site is looking great!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visible.map((s) => {
        const Icon = TYPE_ICONS[s.type] ?? Lightbulb;

        return (
          <div
            key={s.id}
            className={cn(
              'relative bg-slate-800/60 border border-slate-700/50 border-l-2 rounded-lg p-3 group',
              PRIORITY_COLORS[s.priority]
            )}
          >
            {/* Dismiss button */}
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, s.id]))}
              className="absolute top-2 right-2 text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Dismiss suggestion"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="flex items-start gap-2 pr-4">
              <div className="w-6 h-6 rounded-md bg-slate-700/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-slate-200 leading-snug">{s.title}</p>
                  <span className={cn('text-[9px] px-1 py-0.5 rounded font-bold uppercase', PRIORITY_BADGE[s.priority])}>
                    {s.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
                {s.action && onAction && (
                  <button
                    onClick={() => onAction(s)}
                    className="mt-2 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    {s.action.label}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <p className="text-[10px] text-slate-600 text-center pt-1">
        {suggestions.length - visible.length > 0
          ? `${suggestions.length - visible.length} dismissed`
          : `${visible.length} suggestion${visible.length !== 1 ? 's' : ''}`}
      </p>
    </div>
  );
}
