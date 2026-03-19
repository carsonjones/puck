import { useEffect, useRef, useState } from 'react';
import type { GameDetail } from '@/data/api/client';

const parsePlayTime = (t: string) => {
  const m = t.match(/^P(\d+)\s+(\d+):(\d+)$/);
  if (!m) return 0;
  return parseInt(m[1]!) * 1200 + parseInt(m[2]!) * 60 + parseInt(m[3]!);
};

export function GamePlaysTab({ data }: { data: GameDetail }) {
  const prevKeySet = useRef<Set<string> | null>(null);
  const prevTimeSet = useRef<Set<string> | null>(null);
  const prevGameId = useRef<string | number | null>(null);
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  const [correctedKeys, setCorrectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentKeys = new Set(data.plays.map((p) => `${p.time}-${p.description}`));
    const currentTimes = new Set(data.plays.map((p) => p.time));

    const gameChanged = prevGameId.current !== null && prevGameId.current !== data.id;
    if (gameChanged) {
      setNewKeys(new Set());
      setCorrectedKeys(new Set());
    }

    prevGameId.current = data.id;

    if (!gameChanged && prevKeySet.current !== null && prevTimeSet.current !== null) {
      const added = [...currentKeys].filter((k) => !prevKeySet.current!.has(k));
      const brandNew: string[] = [];
      const corrected: string[] = [];
      for (const k of added) {
        const time = k.split('-')[0]!;
        (prevTimeSet.current.has(time) ? corrected : brandNew).push(k);
      }
      if (brandNew.length > 0) setNewKeys((prev) => new Set([...prev, ...brandNew]));
      if (corrected.length > 0) setCorrectedKeys((prev) => new Set([...prev, ...corrected]));
    }

    prevKeySet.current = currentKeys;
    prevTimeSet.current = currentTimes;
  }, [data]);

  const removeNew = (key: string) => setNewKeys((prev) => { const n = new Set(prev); n.delete(key); return n; });
  const removeCorrect = (key: string) => setCorrectedKeys((prev) => { const n = new Set(prev); n.delete(key); return n; });

  const plays = [...data.plays].sort((a, b) => parsePlayTime(b.time) - parsePlayTime(a.time));

  return (
    <ul className="flex flex-col gap-[0.15rem] p-0 list-none m-0">
      {plays.map((play) => {
        const key = `${play.time}-${play.description}`;
        return (
          <li
            key={key}
            className={`flex gap-3 ${newKeys.has(key) ? 'play-new' : correctedKeys.has(key) ? 'play-corrected' : ''}`}
            onAnimationEnd={
              newKeys.has(key) ? () => removeNew(key) :
              correctedKeys.has(key) ? () => removeCorrect(key) : undefined
            }
          >
            <span className="w-[8ch] shrink-0 text-dim whitespace-nowrap">{play.time}</span>
            <span className="min-w-0">{play.description}</span>
          </li>
        );
      })}
    </ul>
  );
}
