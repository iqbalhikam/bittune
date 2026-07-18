export interface FaderConfig {
  id: string;
  label: string;
  typeChar: string; // Command identifier (e.g. 'H', 'M', 'L', 'V', 'B', 'W', 'S')
  min: number;
  max: number;
  defaultValue: number;
  accentColor: string;
  isMaster?: boolean;
}

export interface KnobConfig {
  id: string;
  label: string;
  typeChar: string;
  min: number;
  max: number;
  defaultValue: number;
  accentColor: string;
}

export interface ToggleConfig {
  id: string;
  label: string;
  typeChar: string;
  defaultValue: boolean;
}

export interface Preset {
  name: string;
  desc?: string;
  values: {
    [key: string]: number;
  };
}

export interface DSPStatus {
  sampleRate: string;
  preset: string;
  limiterActive: boolean;
  clipperActive: boolean;
  rssi: number;
  connectionQuality: string;
  cpuUsage: number;
  latency: number;
  temp: number;
  firmwareVersion: string;
}
