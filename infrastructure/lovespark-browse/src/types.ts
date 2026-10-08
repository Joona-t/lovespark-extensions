export interface DaemonState {
  pid: number;
  port: number;
  token: string;
  startedAt: string;
  version: string;
}

export interface GuardLock {
  mode: "careful" | "freeze" | "guard" | "off";
  scope_dir: string | null;
  created_at: string;
}

export interface ConsoleEntry {
  ts: string;
  type: string;
  text: string;
  url?: string;
}

export interface NetworkEntry {
  ts: string;
  method: string;
  url: string;
  status?: number;
  duration_ms?: number;
}

export interface RefInfo {
  id: string;        // @e1, @e2, @c1
  role: string;
  name: string;
  level?: number;
}

export interface ContrastSampleResult {
  ratio: number;
  passes_aa_normal: boolean;
  passes_aa_large: boolean;
  passes_aaa_normal: boolean;
  fg_rgb: [number, number, number];
  bg_rgb: [number, number, number];
  fg_hex: string;
  bg_hex: string;
}

export interface MascotCheckResult {
  present: boolean;
  count: number;
  visible: boolean;
  images: Array<{ src: string; alt: string; visible: boolean }>;
  remedy?: string;
}

export interface ThemeSnapshot {
  theme: string;
  screenshot_path: string;
  viewport: { width: number; height: number };
}
