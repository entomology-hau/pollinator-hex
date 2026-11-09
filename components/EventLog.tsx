import React from 'react';
import { formatEventForDisplay } from './formatEvent';

interface Props { logs: { day: number; event: string }[] }

export const EventLog: React.FC<Props> = ({ logs }) => (
  <details className="bg-slate-900 border border-slate-700 rounded-xl text-left">
    <summary className="cursor-pointer p-4 font-semibold text-sm text-slate-200">Field notes ({logs.length})</summary>
    <ol className="max-h-72 overflow-y-auto px-4 pb-4 space-y-3" aria-label="Event history, latest first" tabIndex={0}>
      {[...logs].reverse().map((log, index) => <li key={logs.length - index} className="border-l-2 border-slate-600 pl-3 text-sm"><span className="text-amber-200">Day {log.day}</span><p className="text-slate-200 mt-1">{formatEventForDisplay(log.event)}</p></li>)}
    </ol>
  </details>
);
