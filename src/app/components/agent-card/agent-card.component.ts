import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Agent, AgentGroup } from '../../models/agent.model';
import { AgentsService } from '../../services/agents.service';

@Component({
  selector: 'app-agent-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <article class="card" [attr.data-testid]="'agent-card-' + agent.id">
    <span class="card__bar" [style.background]="'linear-gradient(90deg,' + group.accent + ',' + group.accent + 'cc)'"></span>

    <header class="card__head">
      <span class="status-dot" [class]="'status-dot--' + agent.loadStatus"></span>
      <span class="card__icon"
            [style.background]="theme() === 'dark' ? group.darkBg : group.lightBg"
            [style.color]="group.accent"
            [style.border-color]="theme() === 'dark' ? group.darkBorder : group.lightBorder">
        {{ agent.icon }}
      </span>
      <div class="card__title">
        <div class="card__name">{{ agent.name }}</div>
        <div class="card__meta">
          <span *ngIf="agent.badge" class="badge" [class]="'badge--' + agent.badge">
            {{ agent.badge }}
          </span>
          <span class="card__ver">{{ agent.version }}</span>
          <span *ngIf="svc.getOverallScore(agent) > 0" class="card__score">
            · {{ svc.getOverallScore(agent) }}/10
          </span>
        </div>
      </div>
      <div class="card__biz" *ngIf="svc.getBizScore(agent) > 0" [style.color]="group.accent">
        {{ svc.getBizScore(agent) }}
      </div>
    </header>

    <p *ngIf="agent.badge === 'orchestrator'" class="rel rel--orch">⚡ Orchestrates specialist sub-agents</p>
    <p *ngIf="agent.badge === 'specialist'" class="rel rel--spec">🔗 Invoked by orchestrator</p>

    <p class="card__what">{{ agent.what }}</p>

    <div class="card__biz-box"
         [style.background]="theme() === 'dark' ? group.darkBg : group.lightBg"
         [style.border-color]="theme() === 'dark' ? group.darkBorder : group.lightBorder">
      <strong>Business value:</strong> {{ agent.businessValue }}
    </div>

    <div class="card__runs" *ngIf="svc.getRunCount(agent.id) > 0">
      ▶ {{ svc.getRunCount(agent.id) }} run{{ svc.getRunCount(agent.id) === 1 ? '' : 's' }}
    </div>

    <div class="card__actions">
      <button class="btn btn--primary"
              [class.btn--ok]="copied()"
              (click)="copyTrigger()"
              [attr.data-testid]="'copy-' + agent.id">
        {{ copied() ? '✓ Copied' : 'Copy Trigger' }}
      </button>
      <button class="btn btn--icon"
              [class.btn--ok]="downloaded()"
              (click)="download()"
              title="Download"
              [attr.data-testid]="'download-' + agent.id">⬇</button>
      <a class="btn btn--icon"
         [href]="'https://github.com/bhaskar-sharma/agentic-universe/blob/master/' + agent.githubPath"
         target="_blank" rel="noopener" title="GitHub">⎇</a>
      <button class="btn btn--icon" (click)="toggle()" [title]="expanded() ? 'Collapse' : 'Expand'"
              [attr.data-testid]="'expand-' + agent.id">
        {{ expanded() ? '▲' : '▼' }}
      </button>
    </div>

    <div class="drawer" *ngIf="expanded()">
      <div class="drawer__block">
        <div class="drawer__label">Trigger</div>
        <pre class="code">{{ agent.trigger }} {{ agent.argHint }}</pre>
      </div>

      <div class="drawer__block">
        <div class="drawer__label">
          File preview
          <span *ngIf="agent.loadStatus === 'loading'" class="muted">loading…</span>
          <span *ngIf="agent.loadStatus === 'error'" class="err">failed to load</span>
        </div>
        <pre class="preview">{{ agent.rawContent || 'Expand to load from GitHub.' }}</pre>
      </div>

      <div class="drawer__block">
        <div class="drawer__label">Evaluator scores</div>
        <div class="score-row">
          <label>Overall <input type="number" min="0" max="10" [(ngModel)]="overall" /></label>
          <label>Biz <input type="number" min="0" max="10" [(ngModel)]="biz" /></label>
          <button class="btn btn--primary" (click)="saveScores()">Save Scores</button>
        </div>
      </div>
    </div>
  </article>
  `,
  styles: [`
    .card { position: relative; background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 10px; transition: box-shadow .15s, transform .15s; }
    .card:hover { box-shadow: var(--shadow-hover); transform: translateY(-1px); }
    .card__bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 10px 10px 0 0; }
    .card__head { display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 10px; padding-top: 4px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
    .status-dot--loaded { background: #10b981; }
    .status-dot--loading { background: var(--amber); animation: pulse 1s infinite; }
    .status-dot--error { background: #ef4444; }
    .card__icon { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 800; font-family: 'JetBrains Mono', monospace; border: 1px solid; }
    .card__name { font-weight: 700; font-size: 14px; color: var(--text); }
    .card__meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
    .card__ver { color: var(--text-muted); }
    .card__score { color: var(--text); }
    .badge { padding: 1px 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; border-radius: 999px; }
    .badge--orchestrator { background: rgba(180, 83, 9, .15); color: var(--amber); }
    .badge--specialist { background: rgba(99, 102, 241, .12); color: #6366f1; }
    .card__biz { font-size: 22px; font-weight: 800; line-height: 1; font-family: 'JetBrains Mono', monospace; }
    .rel { margin: 0; font-size: 11px; color: var(--text-muted); }
    .rel--orch { color: var(--amber); }
    .card__what { margin: 0; font-size: 13px; color: var(--text); line-height: 1.5; }
    .card__biz-box { padding: 8px 10px; border-radius: 6px; border: 1px solid; font-size: 12px; color: var(--text); }
    .card__biz-box strong { display: block; margin-bottom: 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
    .card__runs { font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
    .card__actions { display: flex; gap: 6px; }
    .btn { padding: 6px 10px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .btn:hover { background: var(--input-bg); }
    .btn--primary { flex: 1; background: var(--text); color: var(--card-bg); border-color: var(--text); }
    .btn--icon { width: 30px; padding: 0; }
    .btn--ok { background: #10b981 !important; border-color: #10b981 !important; color: #fff !important; }
    .drawer { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; border-top: 1px dashed var(--border); }
    .drawer__label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 4px; display: flex; gap: 8px; align-items: center; }
    .muted { color: var(--text-faint); text-transform: none; letter-spacing: 0; font-size: 11px; }
    .err { color: #ef4444; text-transform: none; letter-spacing: 0; font-size: 11px; }
    .code { background: var(--code-bg); padding: 8px 10px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text); margin: 0; white-space: pre-wrap; }
    .preview { background: var(--code-bg); padding: 10px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text); margin: 0; max-height: 180px; overflow: auto; white-space: pre-wrap; line-height: 1.4; }
    .score-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .score-row label { font-size: 11px; color: var(--text-muted); display: inline-flex; gap: 4px; align-items: center; }
    .score-row input { width: 50px; padding: 4px 6px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 4px; color: var(--text); font-family: inherit; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  `]
})
export class AgentCardComponent {
  @Input({ required: true }) agent!: Agent;
  @Input({ required: true }) group!: AgentGroup;

  svc = inject(AgentsService);
  expanded = signal(false);
  copied = signal(false);
  downloaded = signal(false);
  overall = 0;
  biz = 0;

  theme = this.svc.theme;

  ngOnInit() {
    this.overall = this.svc.getOverallScore(this.agent);
    this.biz = this.svc.getBizScore(this.agent);
  }

  toggle(): void {
    this.expanded.update(v => !v);
    if (this.expanded() && this.agent.loadStatus === 'idle') {
      this.svc.loadAgent(this.agent.id);
    }
  }

  copyTrigger(): void {
    navigator.clipboard?.writeText(this.agent.trigger).catch(() => {});
    this.svc.logRun(this.agent.id);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  download(): void {
    this.svc.downloadAgentFile(this.agent);
    this.downloaded.set(true);
    setTimeout(() => this.downloaded.set(false), 1500);
  }

  saveScores(): void {
    this.svc.saveScore(this.agent.id, {
      overall: Math.max(0, Math.min(10, +this.overall || 0)),
      biz: Math.max(0, Math.min(10, +this.biz || 0))
    });
  }
}
