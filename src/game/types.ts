export type Stage = 'seed' | 'sprite' | 'entity' | 'apex' | 'ascendant' | 'corrupted';
export type Mood  = 'happy' | 'neutral' | 'sad' | 'tired' | 'hungry' | 'sleeping' | 'overheating' | 'corrupted';

export interface PetState {
  stage:      Stage;
  name:       string;
  signal:     number;   // 0-100 (hunger equivalent)
  coherence:  number;   // 0-100 (happiness)
  heat:       number;   // 0-100 (bad if high)
  power:      number;   // 0-100 (energy)
  age:        number;   // minutes of life
  sleeping:   boolean;
  careScore:  number;   // lifetime care points
  ascensions: number;   // how many times reached ascendant

  corruptTicks: number;  // elapsed seconds in consecutive critical state (≥20 triggers corruption)
  recoverNeeded: number; // defrag actions still needed to recover

  // Cooldowns (unix timestamp when cooldown expires)
  coolSimulate:  number;
  coolDefrag:    number;
  coolOverclock: number;

  lastTick:   number;   // Date.now() of last save
  log:        string[]; // life event history (max 30)
}

export interface LeaderboardEntry {
  username:   string;
  careScore:  number;
  stage:      Stage;
  age:        number;      // minutes
  ascensions: number;
  date:       number;      // Date.now() when entry was recorded
}

export type Action =
  | { type: 'INJECT' }
  | { type: 'SIMULATE' }
  | { type: 'DEFRAG' }
  | { type: 'HIBERNATE' }
  | { type: 'OVERCLOCK' }
  | { type: 'TICK'; now: number }
  | { type: 'LOAD'; state: PetState }
  | { type: 'RENAME'; name: string }
  | { type: 'RESET' };
