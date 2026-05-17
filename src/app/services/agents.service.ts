import { Injectable, computed, signal } from '@angular/core';
import {
  Agent, AgentGroup, AgentMetrics, AgentScores, BadgeType,
  InvocationLog, LogForm, PisState, RunEntry, TeamMemberStats, Theme
} from '../models/agent.model';

const LS = {
  scores: 'jarvis-scores',
  runs: 'jarvis-runs',
  theme: 'jarvis-theme',
  logs: 'jarvis-logs',
  sprint: 'jarvis-sprint',
  user: 'jarvis-user',
  pis: 'jarvis-pis',
  team: 'jarvis-team-size'
};

const GH_OWNER = 'bhaskar-sharma';
const GH_REPO = 'agentic-universe';
const GH_BRANCH = 'master';

const TIME_SAVED: Record<string, number> = {
  'ui-auditor': 45, 'ui-reviewer': 30, 'ui-security': 40, 'ui-testgen': 60, 'ui-a11y': 35,
  'design-handoff-agent': 50, 'design-critique-agent': 30,
  'playwright-test-generator': 90, 'playwright-reviewer': 40, 'design-to-test-bridge': 60,
  'java-code-reviewer': 45, 'java-security-agent': 60, 'api-design-agent': 50, 'maven-dependency-auditor': 30,
  'daml-reviewer': 50, 'canton-model-advisor': 60, 'daml-migrator': 90,
  'confluence-from-daml': 40, 'cross-llm-sync': 25, 'req-to-design-to-test': 120,
  'confluence-analyzer': 30, 'sprint-story-creator': 45, 'blog-agent': 60,
  'pis-bootstrap': 60, 'pis-session-learner': 20, 'pis-minime-builder': 90
};

function seedAgents(): Agent[] {
  const mk = (
    id: string, group: string, name: string, githubPath: string,
    badge: BadgeType, icon: string, what: string, businessValue: string, trigger: string
  ): Agent => ({
    id, group, name, version: 'v1.0', what, businessValue,
    trigger, argHint: '<path or context>',
    overallScore: 0, bizScore: 0, icon, badge, githubPath,
    rawContent: '', loadStatus: 'idle'
  });

  return [
    mk('ui-auditor', 'UI Audit Suite', 'UI Auditor', '.claude/agents/ux/ui-auditor.md', 'orchestrator', 'UA',
      'Orchestrates a full UI audit across review, security, testgen and a11y specialists.',
      'Single command unlocks a multi-dimensional UI quality report — saves hours of manual review per screen.',
      '/ui-auditor'),
    mk('ui-reviewer', 'UI Audit Suite', 'UI Reviewer', '.claude/agents/ux/ui-reviewer.md', 'specialist', 'UR',
      'Reviews UI code for layout, semantics and component quality.',
      'Catches UI regressions before code review — keeps frontend PRs short.',
      '/ui-reviewer'),
    mk('ui-security', 'UI Audit Suite', 'UI Security', '.claude/agents/ux/ui-security.md', 'specialist', 'US',
      'Scans UI for XSS, unsafe HTML binding, exposed secrets and CSP issues.',
      'Prevents OWASP-class frontend bugs from shipping.',
      '/ui-security'),
    mk('ui-testgen', 'UI Audit Suite', 'UI Test Generator', '.claude/agents/ux/ui-testgen.md', 'specialist', 'UT',
      'Generates Playwright tests for UI components and flows.',
      'Eliminates the cold-start cost of writing first-pass UI tests.',
      '/ui-testgen'),
    mk('ui-a11y', 'UI Audit Suite', 'UI Accessibility', '.claude/agents/ux/a11y.md', 'specialist', 'A11',
      'Audits accessibility — WCAG 2.2 AA, ARIA, keyboard reachability, contrast.',
      'Reduces legal and reputational risk; widens addressable user base.',
      '/ui-a11y'),
    mk('design-handoff-agent', 'UX Design', 'Design Handoff', '.claude/agents/ux/design-handoff-agent.md', null, 'DH',
      'Turns Figma frames + spec into a structured engineering handoff.',
      'Cuts the design→engineering loop from days to one command.',
      '/design-handoff'),
    mk('design-critique-agent', 'UX Design', 'Design Critique', '.claude/agents/ux/design-critique-agent.md', null, 'DC',
      'Provides a structured critique of a design artefact.',
      'Surfaces UX issues early — before they cost development cycles.',
      '/design-critique'),
    mk('playwright-test-generator', 'Test Automation', 'Playwright Generator', '.claude/agents/playwright/playwright-test-generator.md', null, 'PG',
      'Generates Playwright e2e tests from a user story or spec.',
      'Bootstraps test coverage on greenfield flows in minutes.',
      '/playwright-gen'),
    mk('playwright-reviewer', 'Test Automation', 'Playwright Reviewer', '.claude/agents/playwright/playwright-reviewer.md', null, 'PR',
      'Reviews Playwright tests for stability, locator quality and coverage.',
      'Reduces flake — keeps the CI signal trustworthy.',
      '/playwright-review'),
    mk('design-to-test-bridge', 'Test Automation', 'Design→Test Bridge', '.claude/agents/playwright/design-to-test-bridge.md', null, 'DB',
      'Translates a design handoff directly into Playwright scaffolding.',
      'Closes the loop from Figma to executable tests.',
      '/design-to-test'),
    mk('java-code-reviewer', 'Java & API', 'Java Code Reviewer', '.claude/agents/java/java-code-reviewer.md', 'orchestrator', 'JR',
      'Reviews Java code for idioms, concurrency, exceptions and design.',
      'Standardises code quality across services without bottlenecking senior engineers.',
      '/java-review'),
    mk('java-security-agent', 'Java & API', 'Java Security', '.claude/agents/java/java-security-agent.md', 'specialist', 'JS',
      'Scans Java code for injection, deserialisation and crypto misuse.',
      'Reduces appsec backlog by catching issues at PR time.',
      '/java-security'),
    mk('api-design-agent', 'Java & API', 'API Design', '.claude/agents/java/api-design-agent.md', null, 'AD',
      'Evaluates API design: REST conventions, versioning, error model, schema.',
      'Drives a consistent API surface across services.',
      '/api-design'),
    mk('maven-dependency-auditor', 'Java & API', 'Maven Auditor', '.claude/agents/java/maven-dependency-auditor.md', null, 'MA',
      'Audits Maven dependencies for CVEs, licence risk and version drift.',
      'Pre-empts supply-chain incidents before release.',
      '/maven-audit'),
    mk('daml-reviewer', 'Daml & Canton', 'Daml Reviewer', '.claude/agents/daml/daml-reviewer.md', null, 'DR',
      'Reviews Daml contract code for safety, authority and idiom.',
      'Catches contract bugs that are extremely expensive to fix post-deploy.',
      '/daml-review'),
    mk('canton-model-advisor', 'Daml & Canton', 'Canton Model Advisor', '.claude/agents/daml/canton-model-advisor.md', null, 'CM',
      'Advises on Canton topology and party/domain modelling.',
      'Avoids costly redesigns of the trust graph.',
      '/canton-advise'),
    mk('daml-migrator', 'Daml & Canton', 'Daml Migrator', '.claude/agents/daml/daml-migrator.md', null, 'DM',
      'Plans and executes Daml model migrations.',
      'De-risks SDK and model upgrades.',
      '/daml-migrate'),
    mk('confluence-from-daml', 'Cross-Skill', 'Confluence from Daml', '.claude/agents/cross-skill/confluence-from-daml-model.md', null, 'CF',
      'Generates Confluence documentation from a Daml model.',
      'Keeps business-facing docs in sync with the live contract model.',
      '/conf-from-daml'),
    mk('cross-llm-sync', 'Cross-Skill', 'Cross-LLM Sync', '.claude/agents/cross-skill/cross-llm-sync.md', null, 'XS',
      'Synchronises context across LLM providers.',
      'Avoids context loss when working across tools.',
      '/cross-llm'),
    mk('req-to-design-to-test', 'Cross-Skill', 'Requirements→Design→Test', '.claude/agents/req-pipeline/SKILL.md', 'orchestrator', 'RD',
      'End-to-end pipeline: requirement → design → test plan → tests.',
      'Compresses the full delivery loop into a single orchestration.',
      '/req-pipeline'),
    mk('confluence-analyzer', 'Documentation', 'Confluence Analyzer', '.claude/agents/documentation/confluence-analyzer.md', null, 'CA',
      'Analyses Confluence content for staleness, gaps and structure.',
      'Surfaces documentation rot before it bites onboarding.',
      '/conf-analyze'),
    mk('sprint-story-creator', 'Documentation', 'Sprint Story Creator', '.claude/agents/documentation/sprint-story-creator.md', null, 'SS',
      'Drafts well-formed user stories with acceptance criteria.',
      'Removes the cold-start cost of grooming.',
      '/sprint-story'),
    mk('blog-agent', 'Content', 'Blog Agent', '.claude/agents/content/blog-agent.md', null, 'BL',
      'Drafts engineering blog posts from a topic or commit history.',
      'Lowers the activation energy for technical content marketing.',
      '/blog'),
    mk('pis-bootstrap', 'Intelligence', 'PIS Bootstrap', '.claude/agents/pis/pis-bootstrap.md', 'orchestrator', 'PB',
      'Bootstraps a Personal Intelligence System for a project.',
      'Foundation for cumulative, project-aware AI assistance.',
      '/pis-bootstrap'),
    mk('pis-session-learner', 'Intelligence', 'PIS Session Learner', '.claude/agents/pis/pis-session-learner.md', null, 'PL',
      'Captures lessons from each session into the PIS.',
      'Turns one-off sessions into compounding knowledge.',
      '/pis-learn'),
    mk('pis-minime-builder', 'Intelligence', 'PIS Mini-Me Builder', '.claude/agents/pis/pis-minime-builder.md', null, 'PM',
      'Builds a project-specific mini-me agent from the PIS.',
      'Yields an agent that knows your project as well as you do.',
      '/pis-minime')
  ];
}

const GROUPS: AgentGroup[] = [
  { name: 'UI Audit Suite',  accent: '#0D9488', lightBg: '#F0FDFA', darkBg: '#0F2D2A', lightBorder: '#99F6E4', darkBorder: '#134E4A' },
  { name: 'UX Design',       accent: '#B45309', lightBg: '#FFFBEB', darkBg: '#2A1F0F', lightBorder: '#FDE68A', darkBorder: '#78350F' },
  { name: 'Test Automation', accent: '#047857', lightBg: '#ECFDF5', darkBg: '#0F2A1E', lightBorder: '#A7F3D0', darkBorder: '#064E3B' },
  { name: 'Java & API',      accent: '#C2410C', lightBg: '#FFF7ED', darkBg: '#2A1810', lightBorder: '#FED7AA', darkBorder: '#7C2D12' },
  { name: 'Daml & Canton',   accent: '#6D28D9', lightBg: '#F5F3FF', darkBg: '#1F1830', lightBorder: '#DDD6FE', darkBorder: '#4C1D95' },
  { name: 'Cross-Skill',     accent: '#BE185D', lightBg: '#FDF2F8', darkBg: '#2A1020', lightBorder: '#FBCFE8', darkBorder: '#831843' },
  { name: 'Documentation',   accent: '#1D4ED8', lightBg: '#EFF6FF', darkBg: '#10203A', lightBorder: '#BFDBFE', darkBorder: '#1E3A8A' },
  { name: 'Content',         accent: '#0E7490', lightBg: '#ECFEFF', darkBg: '#0F262A', lightBorder: '#A5F3FC', darkBorder: '#155E75' },
  { name: 'Intelligence',    accent: '#6D28D9', lightBg: '#F5F3FF', darkBg: '#1F1830', lightBorder: '#DDD6FE', darkBorder: '#4C1D95' }
];

@Injectable({ providedIn: 'root' })
export class AgentsService {
  readonly groups = GROUPS;

  agents = signal<Agent[]>(seedAgents());
  theme = signal<Theme>('light');
  search = signal<string>('');
  activeGroup = signal<string>('all');
  activeView = signal<'agents' | 'jarvis'>('agents');
  scores = signal<Record<string, AgentScores>>({});
  runs = signal<RunEntry[]>([]);
  logs = signal<InvocationLog[]>([]);
  currentSprint = signal<string>('Sprint-12');
  currentUser = signal<string>('me');
  teamSize = signal<number>(8);
  pisState = signal<PisState>({
    projectName: 'Project Phoenix',
    version: 'v0.4',
    sessionsLogged: 0,
    progressToV1: 40,
    areas: [
      { name: 'Architecture', maturity: 55 },
      { name: 'Domain model', maturity: 45 },
      { name: 'Test strategy', maturity: 30 },
      { name: 'Ops & runbooks', maturity: 25 }
    ]
  });

  filteredAgents = computed(() => {
    const q = this.search().trim().toLowerCase();
    const grp = this.activeGroup();
    return this.agents().filter(a => {
      if (grp !== 'all' && a.group !== grp) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q)
        || a.group.toLowerCase().includes(q)
        || a.what.toLowerCase().includes(q);
    });
  });

  loadedCount = computed(() => this.agents().filter(a => a.loadStatus === 'loaded').length);
  scoredCount = computed(() => Object.keys(this.scores()).length);

  sprintLogs = computed(() => this.logs().filter(l => l.sprint === this.currentSprint()));

  totalInvocations = computed(() => this.logs().length);
  totalTimeSavedHours = computed(() =>
    Math.round(this.logs().reduce((s, l) => s + l.timeSavedMin, 0) / 60 * 10) / 10);
  totalPrevented = computed(() => this.logs().reduce((s, l) => s + l.actioned, 0));

  weeklyInvocations = computed(() => {
    const wkAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.logs().filter(l => l.timestamp >= wkAgo).length;
  });

  activeUsers = computed(() => {
    const wkAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Set(this.logs().filter(l => l.timestamp >= wkAgo).map(l => l.user)).size;
  });

  adoptionRate = computed(() => {
    const ts = this.teamSize();
    if (!ts) return 0;
    return Math.round((this.activeUsers() / ts) * 100);
  });

  sprintMetrics = computed(() => {
    const sl = this.sprintLogs();
    const timeSavedMin = sl.reduce((s, l) => s + l.timeSavedMin, 0);
    const prevented = sl.reduce((s, l) => s + l.actioned, 0);
    const totalFindings = sl.reduce((s, l) => s + l.findingCount, 0);
    const actionRate = totalFindings ? Math.round((prevented / totalFindings) * 100) : 0;
    return {
      runs: sl.length,
      timeSavedHours: Math.round(timeSavedMin / 60 * 10) / 10,
      prevented,
      actionRate
    };
  });

  agentMetrics = computed(() => {
    const out: Record<string, AgentMetrics> = {};
    for (const a of this.agents()) {
      out[a.id] = { runs: 0, timeSavedMin: 0, preventedIssues: 0, actionRate: 0, uniqueUsers: 0, lastUsed: null };
    }
    const findings: Record<string, number> = {};
    const users: Record<string, Set<string>> = {};
    for (const l of this.logs()) {
      const m = out[l.agentId];
      if (!m) continue;
      m.runs++;
      m.timeSavedMin += l.timeSavedMin;
      m.preventedIssues += l.actioned;
      findings[l.agentId] = (findings[l.agentId] || 0) + l.findingCount;
      (users[l.agentId] = users[l.agentId] || new Set()).add(l.user);
      if (!m.lastUsed || l.timestamp > m.lastUsed) m.lastUsed = l.timestamp;
    }
    for (const id of Object.keys(out)) {
      const f = findings[id] || 0;
      out[id].actionRate = f ? Math.round((out[id].preventedIssues / f) * 100) : 0;
      out[id].uniqueUsers = users[id]?.size || 0;
    }
    return out;
  });

  teamStats = computed<TeamMemberStats[]>(() => {
    const byUser: Record<string, { runs: number; agents: Set<string>; timeSavedMin: number }> = {};
    for (const l of this.logs()) {
      const u = byUser[l.user] = byUser[l.user] || { runs: 0, agents: new Set(), timeSavedMin: 0 };
      u.runs++;
      u.agents.add(l.agentId);
      u.timeSavedMin += l.timeSavedMin;
    }
    const total = this.agents().length || 1;
    return Object.entries(byUser)
      .map(([user, v]) => ({
        user, runs: v.runs, uniqueAgents: v.agents.size,
        timeSavedMin: v.timeSavedMin,
        breadth: Math.round((v.agents.size / total) * 100)
      }))
      .sort((a, b) => b.runs - a.runs);
  });

  constructor() {
    this.loadPersistedData();
    document.body.classList.toggle('eclipse', this.theme() === 'dark');
  }

  getGroup(name: string): AgentGroup | undefined {
    return this.groups.find(g => g.name === name);
  }

  getGroupsForFiltered(): AgentGroup[] {
    const present = new Set(this.filteredAgents().map(a => a.group));
    return this.groups.filter(g => present.has(g.name));
  }

  getAgentsForGroup(name: string): Agent[] {
    return this.filteredAgents().filter(a => a.group === name);
  }

  getBizScore(a: Agent): number { return this.scores()[a.id]?.biz ?? a.bizScore; }
  getOverallScore(a: Agent): number { return this.scores()[a.id]?.overall ?? a.overallScore; }
  getRunCount(id: string): number { return this.runs().filter(r => r.agentId === id).length; }
  getAgentMetrics(id: string): AgentMetrics {
    return this.agentMetrics()[id] || { runs: 0, timeSavedMin: 0, preventedIssues: 0, actionRate: 0, uniqueUsers: 0, lastUsed: null };
  }

  async loadAllFromGitHub(): Promise<void> {
    await Promise.all(this.agents().map(a => this.loadAgent(a.id)));
  }

  async loadAgent(id: string): Promise<void> {
    const agent = this.agents().find(a => a.id === id);
    if (!agent || agent.loadStatus === 'loaded') return;
    this.updateAgent(id, { loadStatus: 'loading' });
    try {
      const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${agent.githubPath}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      this.updateAgent(id, { rawContent: text, loadStatus: 'loaded' });
    } catch {
      this.updateAgent(id, { loadStatus: 'error' });
    }
  }

  downloadAgentFile(agent: Agent): void {
    const body = agent.rawContent || `# ${agent.name}\n\n${agent.what}\n\n${agent.businessValue}\n`;
    const blob = new Blob([body], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.id}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  toggleTheme(): void {
    const next: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    document.body.classList.toggle('eclipse', next === 'dark');
    this.persist();
  }

  saveScore(id: string, scores: AgentScores): void {
    this.scores.update(s => ({ ...s, [id]: scores }));
    this.persist();
  }

  logRun(id: string): void {
    this.runs.update(r => [...r, { agentId: id, ts: Date.now() }]);
    this.persist();
  }

  logInvocation(form: LogForm): InvocationLog | null {
    const agent = this.agents().find(a => a.id === form.agentId);
    if (!agent) return null;
    const group = this.getGroup(agent.group);
    const entry: InvocationLog = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      agentId: agent.id,
      agentName: agent.name,
      domain: agent.group,
      accent: group?.accent ?? '#666',
      timestamp: Date.now(),
      user: this.currentUser(),
      sessionId: `s_${Date.now()}`,
      outcome: form.outcome,
      findingCount: form.findingCount,
      actioned: form.actioned,
      dismissed: form.dismissed,
      timeSavedMin: TIME_SAVED[agent.id] ?? 30,
      sprint: this.currentSprint()
    };
    this.logs.update(l => [entry, ...l]);
    this.logRun(agent.id);
    return entry;
  }

  updatePisState(patch: Partial<PisState>): void {
    this.pisState.update(p => ({ ...p, ...patch }));
    this.persist();
  }

  buildDigestMarkdown(): string {
    const sprint = this.currentSprint();
    const m = this.sprintMetrics();
    const sl = this.sprintLogs();
    const byAgent: Record<string, number> = {};
    for (const l of sl) byAgent[l.agentName] = (byAgent[l.agentName] || 0) + 1;
    const topAgents = Object.entries(byAgent).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const lines: string[] = [];
    lines.push(`# Jarvis Digest — ${sprint}`);
    lines.push('');
    lines.push(`_Generated ${new Date().toISOString()}_`);
    lines.push('');
    lines.push('## Sprint metrics');
    lines.push(`- Invocations: **${m.runs}**`);
    lines.push(`- Time saved: **${m.timeSavedHours} h**`);
    lines.push(`- Issues prevented: **${m.prevented}**`);
    lines.push(`- Action rate: **${m.actionRate}%**`);
    lines.push('');
    lines.push('## Top agents');
    if (topAgents.length === 0) lines.push('_No invocations recorded._');
    for (const [name, count] of topAgents) lines.push(`- ${name} — ${count}`);
    lines.push('');
    lines.push('## Team adoption');
    lines.push(`- Active users (7d): ${this.activeUsers()} / ${this.teamSize()} (${this.adoptionRate()}%)`);
    lines.push('');
    const p = this.pisState();
    lines.push('## PIS state');
    lines.push(`- Project: ${p.projectName} ${p.version}`);
    lines.push(`- Progress to v1.0: ${p.progressToV1}%`);
    lines.push(`- Sessions logged: ${p.sessionsLogged}`);
    for (const a of p.areas) lines.push(`  - ${a.name}: ${a.maturity}%`);
    return lines.join('\n');
  }

  exportDigest(): void {
    const md = this.buildDigestMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digest-${this.currentSprint()}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private updateAgent(id: string, patch: Partial<Agent>): void {
    this.agents.update(list => list.map(a => a.id === id ? { ...a, ...patch } : a));
  }

  loadPersistedData(): void {
    try {
      const t = localStorage.getItem(LS.theme) as Theme | null;
      if (t) this.theme.set(t);
      const sc = localStorage.getItem(LS.scores);
      if (sc) this.scores.set(JSON.parse(sc));
      const r = localStorage.getItem(LS.runs);
      if (r) this.runs.set(JSON.parse(r));
      const l = localStorage.getItem(LS.logs);
      if (l) this.logs.set(JSON.parse(l));
      const sp = localStorage.getItem(LS.sprint);
      if (sp) this.currentSprint.set(sp);
      const u = localStorage.getItem(LS.user);
      if (u) this.currentUser.set(u);
      const p = localStorage.getItem(LS.pis);
      if (p) this.pisState.set(JSON.parse(p));
      const ts = localStorage.getItem(LS.team);
      if (ts) this.teamSize.set(parseInt(ts, 10) || 8);
    } catch { /* ignore */ }
  }

  persist(): void {
    try {
      localStorage.setItem(LS.theme, this.theme());
      localStorage.setItem(LS.scores, JSON.stringify(this.scores()));
      localStorage.setItem(LS.runs, JSON.stringify(this.runs()));
      localStorage.setItem(LS.logs, JSON.stringify(this.logs()));
      localStorage.setItem(LS.sprint, this.currentSprint());
      localStorage.setItem(LS.user, this.currentUser());
      localStorage.setItem(LS.pis, JSON.stringify(this.pisState()));
      localStorage.setItem(LS.team, String(this.teamSize()));
    } catch { /* ignore */ }
  }
}
