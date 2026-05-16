export type BadgeType = 'orchestrator' | 'specialist' | null;
export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';
export type Theme = 'light' | 'dark';

export interface Agent {
  id: string;
  group: string;
  name: string;
  version: string;
  what: string;
  businessValue: string;
  trigger: string;
  argHint: string;
  overallScore: number;
  bizScore: number;
  icon: string;
  badge: BadgeType;
  githubPath: string;
  rawContent: string;
  loadStatus: LoadStatus;
}

export interface AgentGroup {
  name: string;
  accent: string;
  lightBg: string;
  darkBg: string;
  lightBorder: string;
  darkBorder: string;
}

export interface AgentScores {
  overall: number;
  biz: number;
}

export interface RunEntry {
  agentId: string;
  ts: number;
}

export interface InvocationLog {
  id: string;
  agentId: string;
  agentName: string;
  domain: string;
  accent: string;
  timestamp: number;
  user: string;
  sessionId: string;
  outcome: 'success' | 'partial' | 'noissue' | 'failed';
  findingCount: number;
  actioned: number;
  dismissed: number;
  timeSavedMin: number;
  sprint: string;
}

export interface AgentMetrics {
  runs: number;
  timeSavedMin: number;
  preventedIssues: number;
  actionRate: number;
  uniqueUsers: number;
  lastUsed: number | null;
}

export interface TeamMemberStats {
  user: string;
  runs: number;
  uniqueAgents: number;
  timeSavedMin: number;
  breadth: number;
}

export interface PisArea {
  name: string;
  maturity: number;
}

export interface PisState {
  projectName: string;
  version: string;
  sessionsLogged: number;
  progressToV1: number;
  areas: PisArea[];
}

export interface LogForm {
  agentId: string;
  outcome: InvocationLog['outcome'];
  findingCount: number;
  actioned: number;
  dismissed: number;
}
