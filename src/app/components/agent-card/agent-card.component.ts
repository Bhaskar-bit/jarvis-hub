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
  <article class="mod arc-frame--4"
           [class.mod--loaded]="agent.loadStatus === 'loaded'"
           [class.mod--loading]="agent.loadStatus === 'loading'"
           [class.mod--error]="agent.loadStatus === 'error'"
           [attr.data-testid]="'agent-card-' + agent.id">
    <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
    <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>

    <!-- accent strip -->
    <span class="mod__strip" [style.background]="group.accent" [style.box-shadow]="'0 0 8px ' + group.accent"></span>

    <!-- head -->
    <header class="mod__head">
      <div class="mod__icon-wrap">
        <svg viewBox="0 0 50 50" class="mod__rings" *ngIf="agent.loadStatus === 'loading'">
          <circle cx="25" cy="25" r="22" fill="none" stroke="#22d3ee" stroke-width="1" stroke-dasharray="6 6" class="ring1"/>
        </svg>
        <span class="mod__icon"
              [style.background]="'linear-gradient(135deg,' + group.accent + '20,' + group.accent + '08)'"
              [style.color]="group.accent"
              [style.border-color]="group.accent">
          {{ agent.icon }}
        </span>
        <span class="mod__status" [class]="'mod__status--' + agent.loadStatus"></span>
      </div>

      <div class="mod__title">
        <div class="mod__name">{{ agent.name }}</div>
        <div class="mod__meta arc-mono">
          <span *ngIf="agent.badge" class="mod__badge" [class]="'mod__badge--' + agent.badge"
                [style.color]="agent.badge === 'orchestrator' ? '#f59e0b' : '#22d3ee'">
            ◆ {{ agent.badge.toUpperCase() }}
          </span>
          <span class="mod__ver">{{ agent.version.toUpperCase() }}</span>
          <span *ngIf="svc.getOverallScore(agent) > 0" class="mod__score">· {{ svc.getOverallScore(agent) }}/10</span>
        </div>
      </div>

      <div class="mod__biz arc-data" *ngIf="svc.getBizScore(agent) > 0" [style.color]="group.accent">
        {{ svc.getBizScore(agent) }}
      </div>
    </header>

    <!-- relationship note -->
    <p *ngIf="agent.badge === 'orchestrator'" class="mod__rel mod__rel--orch arc-mono">⚡ ORCHESTRATES SUB-AGENTS</p>
    <p *ngIf="agent.badge === 'specialist'"    class="mod__rel mod__rel--spec arc-mono">↳ INVOKED BY ORCHESTRATOR</p>

    <!-- description -->
    <p class="mod__what">{{ agent.what }}</p>

    <!-- value box -->
    <div class="mod__val">
      <div class="mod__val-lbl arc-title" [style.color]="group.accent">▸ VALUE</div>
      <div class="mod__val-txt">{{ agent.businessValue }}</div>
    </div>

    <!-- run count -->
    <div class="mod__ops arc-mono" *ngIf="svc.getRunCount(agent.id) > 0">
      ▶ {{ svc.getRunCount(agent.id) }} OPS LOGGED
    </div>

    <!-- actions -->
    <div class="mod__actions">
      <button class="arc-btn arc-btn--sm mod__primary"
              [class.arc-btn--amber]="!copied()"
              [class.mod__primary--ok]="copied()"
              (click)="copyTrigger()"
              [attr.data-testid]="'copy-' + agent.id">
        {{ copied() ? '✓ COPIED' : '◀ COPY TRIGGER' }}
      </button>
      <button class="arc-btn arc-btn--sm icon"
              [class.mod__primary--ok]="downloaded()"
              (click)="download()" title="Download"
              [attr.data-testid]="'download-' + agent.id">▼</button>
      <a class="arc-btn arc-btn--sm icon"
         [href]="'https://github.com/bhaskar-sharma/agentic-universe/blob/master/' + agent.githubPath"
         target="_blank" rel="noopener" title="Source">⎇</a>
      <button class="arc-btn arc-btn--sm icon" (click)="toggle()"
              [attr.data-testid]="'expand-' + agent.id">
        {{ expanded() ? '▲' : '▼' }}
      </button>
    </div>

    <!-- drawer -->
    <div class="mod__drawer" *ngIf="expanded()">
      <div class="mod__block">
        <div class="mod__block-lbl arc-title">▸ TRIGGER</div>
        <pre class="code">{{ agent.trigger }} {{ agent.argHint }}</pre>
      </div>

      <div class="mod__block">
        <div class="mod__block-lbl arc-title">
          ▸ MANIFEST
          <span *ngIf="agent.loadStatus === 'loading'" class="muted">LOADING…</span>
          <span *ngIf="agent.loadStatus === 'error'" class="err">FAILED</span>
        </div>
        <pre class="preview">{{ agent.rawContent || 'EXPAND TO LOAD FROM GITHUB.' }}</pre>
      </div>

      <div class="mod__block">
        <div class="mod__block-lbl arc-title">▸ SCORES</div>
        <div class="mod__score-row">
          <label class="cmd-field">
            <span>OVERALL</span>
            <input class="arc-input" type="number" min="0" max="10" [(ngModel)]="overall"/>
          </label>
          <label class="cmd-field">
            <span>BIZ</span>
            <input class="arc-input" type="number" min="0" max="10" [(ngModel)]="biz"/>
          </label>
          <button class="arc-btn arc-btn--sm" (click)="saveScores()">▶ SAVE</button>
        </div>
      </div>
    </div>
  </article>
  `,
  styles: [`
    .mod {
      position: relative;
      background: linear-gradient(180deg, rgba(34,211,238,.04), transparent 50%), var(--panel);
      border: 1px solid var(--line);
      backdrop-filter: blur(6px);
      padding: 14px;
      display: flex; flex-direction: column; gap: 10px;
      transition: all .2s;
    }
    .mod:hover {
      border-color: var(--line-strong);
      box-shadow: var(--shadow-hover), var(--glow-soft);
      transform: translateY(-2px);
    }
    .mod__strip {
      position: absolute; top: 0; left: 0; right: 0; height: 2px;
    }

    /* head */
    .mod__head { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; }
    .mod__icon-wrap { position: relative; width: 40px; height: 40px; }
    .mod__icon {
      width: 40px; height: 40px;
      display: grid; place-items: center;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 1px;
      border: 1px solid;
      position: relative;
      z-index: 1;
    }
    .mod__rings { position: absolute; inset: -5px; width: 50px; height: 50px; pointer-events: none; }
    .ring1 { transform-origin: center; animation: spin-slow 2s linear infinite; }
    @keyframes spin-slow { to { transform: rotate(360deg); } }

    .mod__status {
      position: absolute;
      bottom: -2px; right: -2px;
      width: 8px; height: 8px;
      background: var(--text-faint);
      border-radius: 50%;
      z-index: 2;
    }
    .mod__status--loaded  { background: var(--green); box-shadow: 0 0 8px var(--green); }
    .mod__status--loading { background: var(--amber); box-shadow: 0 0 8px var(--amber); animation: pulse-soft 1s infinite; }
    .mod__status--error   { background: var(--red);   box-shadow: 0 0 8px var(--red); }
    @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

    .mod__name { font-size: 13px; font-weight: 700; color: var(--text); letter-spacing: 0.3px; }
    .mod__meta { font-size: 9px; color: var(--text-dim); margin-top: 3px; display: flex; gap: 6px; align-items: center; letter-spacing: 1px; }
    .mod__badge { font-size: 8px; letter-spacing: 1.5px; }
    .mod__ver, .mod__score { color: var(--text-faint); }
    .mod__biz {
      font-family: 'Orbitron', monospace;
      font-size: 22px;
      font-weight: 700;
      line-height: 1;
      text-shadow: 0 0 10px currentColor;
    }

    /* relationship */
    .mod__rel {
      margin: 0;
      font-size: 9px;
      letter-spacing: 1.5px;
      color: var(--text-dim);
    }
    .mod__rel--orch { color: var(--amber); }
    .mod__rel--spec { color: var(--cyan-soft); }

    /* description */
    .mod__what { margin: 0; font-size: 12.5px; color: var(--text); line-height: 1.55; }

    /* value */
    .mod__val {
      border-left: 2px solid var(--cyan);
      padding: 6px 10px;
      background: rgba(34,211,238,.04);
    }
    .mod__val-lbl { font-size: 9px; letter-spacing: 2px; margin-bottom: 2px; }
    .mod__val-txt { font-size: 11.5px; color: var(--text); line-height: 1.5; }

    .mod__ops { font-size: 9px; color: var(--cyan-soft); letter-spacing: 1.5px; }

    /* actions */
    .mod__actions { display: flex; gap: 5px; margin-top: auto; }
    .mod__primary { flex: 1; }
    .mod__primary--ok { background: rgba(52,211,153,.12) !important; border-color: var(--green) !important; color: var(--green) !important; box-shadow: 0 0 12px rgba(52,211,153,.4); }
    .icon { width: 32px; padding: 0; }

    /* drawer */
    .mod__drawer { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; border-top: 1px dashed var(--line); }
    .mod__block-lbl { font-size: 9px; letter-spacing: 2px; color: var(--cyan); margin-bottom: 4px; display: flex; gap: 8px; align-items: center; }
    .muted { color: var(--text-faint); font-size: 9px; letter-spacing: 1px; }
    .err   { color: var(--red); font-size: 9px; letter-spacing: 1px; }
    .code, .preview {
      background: var(--code-bg);
      padding: 8px 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: var(--cyan-soft);
      margin: 0;
      white-space: pre-wrap;
      border-left: 2px solid var(--line);
      line-height: 1.5;
    }
    .preview { font-size: 10px; max-height: 180px; overflow: auto; color: var(--text-dim); }
    .mod__score-row { display: flex; gap: 8px; align-items: end; }
    .mod__score-row .cmd-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .mod__score-row .cmd-field span { font-family: 'Orbitron', monospace; font-size: 9px; letter-spacing: 2px; color: var(--text-dim); }
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
