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
  <article class="mod"
           [class.mod--loaded]="agent.loadStatus === 'loaded'"
           [class.mod--loading]="agent.loadStatus === 'loading'"
           [class.mod--error]="agent.loadStatus === 'error'"
           [style.--accent]="group.accent"
           [attr.data-testid]="'agent-card-' + agent.id">
    <!-- thin accent strip -->
    <span class="mod__strip"></span>

    <!-- head -->
    <header class="mod__head">
      <div class="mod__icon-wrap">
        <span class="mod__icon">{{ agent.icon }}</span>
        <span class="mod__status" [class]="'mod__status--' + agent.loadStatus"></span>
      </div>

      <div class="mod__title">
        <div class="mod__name">{{ agent.name }}</div>
        <div class="mod__meta arc-mono">
          <span *ngIf="agent.badge" class="mod__badge" [class]="'mod__badge--' + agent.badge">
            {{ agent.badge }}
          </span>
          <span class="mod__ver">{{ agent.version }}</span>
          <span *ngIf="svc.getOverallScore(agent) > 0" class="mod__score">· {{ svc.getOverallScore(agent) }}/10</span>
        </div>
      </div>

      <div class="mod__biz arc-data" *ngIf="svc.getBizScore(agent) > 0">
        {{ svc.getBizScore(agent) }}
      </div>
    </header>

    <!-- relationship note -->
    <p *ngIf="agent.badge === 'orchestrator'" class="mod__rel mod__rel--orch">Orchestrates specialist sub-agents</p>
    <p *ngIf="agent.badge === 'specialist'"    class="mod__rel mod__rel--spec">Invoked by orchestrator</p>

    <!-- description -->
    <p class="mod__what">{{ agent.what }}</p>

    <!-- value box -->
    <div class="mod__val">
      <div class="mod__val-lbl arc-title">Value</div>
      <div class="mod__val-txt">{{ agent.businessValue }}</div>
    </div>

    <!-- run count -->
    <div class="mod__ops arc-mono" *ngIf="svc.getRunCount(agent.id) > 0">
      {{ svc.getRunCount(agent.id) }} ops logged
    </div>

    <!-- actions -->
    <div class="mod__actions">
      <button class="arc-btn arc-btn--sm mod__primary"
              [class.mod__primary--ok]="copied()"
              (click)="copyTrigger()"
              [attr.data-testid]="'copy-' + agent.id">
        {{ copied() ? 'Copied' : 'Copy Trigger' }}
      </button>
      <button class="arc-btn arc-btn--sm icon"
              [class.mod__primary--ok]="downloaded()"
              (click)="download()" title="Download"
              [attr.data-testid]="'download-' + agent.id">↓</button>
      <a class="arc-btn arc-btn--sm icon"
         [href]="'https://github.com/bhaskar-sharma/agentic-universe/blob/master/' + agent.githubPath"
         target="_blank" rel="noopener" title="Source">⎇</a>
      <button class="arc-btn arc-btn--sm icon" (click)="toggle()"
              [attr.data-testid]="'expand-' + agent.id">
        {{ expanded() ? '−' : '+' }}
      </button>
    </div>

    <!-- drawer -->
    <div class="mod__drawer" *ngIf="expanded()">
      <div class="mod__block">
        <div class="mod__block-lbl arc-title">Trigger</div>
        <pre class="code">{{ agent.trigger }} {{ agent.argHint }}</pre>
      </div>

      <div class="mod__block">
        <div class="mod__block-lbl arc-title">
          Manifest
          <span *ngIf="agent.loadStatus === 'loading'" class="muted">Loading…</span>
          <span *ngIf="agent.loadStatus === 'error'" class="err">Failed</span>
        </div>
        <pre class="preview">{{ agent.rawContent || 'Expand to load from GitHub.' }}</pre>
      </div>

      <div class="mod__block">
        <div class="mod__block-lbl arc-title">Evaluator scores</div>
        <div class="mod__score-row">
          <label class="cmd-field">
            <span>Overall</span>
            <input class="arc-input" type="number" min="0" max="10" [(ngModel)]="overall"/>
          </label>
          <label class="cmd-field">
            <span>Biz</span>
            <input class="arc-input" type="number" min="0" max="10" [(ngModel)]="biz"/>
          </label>
          <button class="arc-btn arc-btn--sm" (click)="saveScores()">Save</button>
        </div>
      </div>
    </div>
  </article>
  `,
  styles: [`
    .mod {
      --accent: var(--teal);
      position: relative;
      background: var(--panel-solid);
      border: 1px solid var(--line);
      padding: 22px 22px 18px;
      display: flex; flex-direction: column; gap: 14px;
      border-radius: 2px;
      transition: all .3s cubic-bezier(.16,.84,.44,1);
    }
    .mod:hover {
      border-color: var(--line-strong);
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }
    .mod__strip {
      position: absolute; top: 0; left: 0;
      width: 36px; height: 2px;
      background: var(--accent);
      transition: width .4s ease;
    }
    .mod:hover .mod__strip { width: 72px; }

    /* head */
    .mod__head { display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; }
    .mod__icon-wrap { position: relative; width: 36px; height: 36px; }
    .mod__icon {
      width: 36px; height: 36px;
      display: grid; place-items: center;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 1px;
      color: var(--accent);
      background: var(--bg-elev);
      border: 1px solid var(--line);
      border-radius: 50%;
    }

    .mod__status {
      position: absolute;
      top: -1px; right: -1px;
      width: 8px; height: 8px;
      background: var(--text-mute);
      border: 2px solid var(--panel-solid);
      border-radius: 50%;
    }
    .mod__status--loaded  { background: var(--green); }
    .mod__status--loading { background: var(--copper); animation: pulse 1.6s ease-in-out infinite; }
    .mod__status--error   { background: var(--red); }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

    .mod__name { font-size: 14px; font-weight: 600; color: var(--text); letter-spacing: 0; }
    .mod__meta {
      font-size: 10px;
      color: var(--text-dim);
      margin-top: 3px;
      display: flex; gap: 8px;
      align-items: center;
      letter-spacing: 0.5px;
    }
    .mod__badge {
      font-size: 9px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--text-dim);
    }
    .mod__badge--orchestrator { color: var(--copper); }
    .mod__badge--specialist   { color: var(--teal); }
    .mod__ver, .mod__score { color: var(--text-faint); }
    .mod__biz {
      font-family: 'Orbitron', monospace;
      font-size: 24px;
      font-weight: 600;
      line-height: 1;
      color: var(--accent);
    }

    /* relationship */
    .mod__rel {
      margin: 0;
      font-size: 11px;
      color: var(--text-dim);
      font-style: italic;
    }
    .mod__rel--orch { color: var(--copper); }
    .mod__rel--spec { color: var(--teal); }

    /* description */
    .mod__what { margin: 0; font-size: 13px; color: var(--text); line-height: 1.6; }

    /* value */
    .mod__val {
      border-left: 2px solid var(--accent);
      padding: 8px 14px;
      background: var(--bg-elev);
    }
    .mod__val-lbl {
      font-size: 9px;
      letter-spacing: 2px;
      color: var(--text-dim);
      margin-bottom: 4px;
    }
    .mod__val-txt { font-size: 12px; color: var(--text); line-height: 1.55; }

    .mod__ops {
      font-size: 10px;
      color: var(--text-dim);
      letter-spacing: 0.5px;
    }

    /* actions */
    .mod__actions { display: flex; gap: 6px; margin-top: auto; padding-top: 4px; }
    .mod__primary { flex: 1; }
    .mod__primary--ok {
      background: var(--green) !important;
      border-color: var(--green) !important;
      color: #fff !important;
    }
    .icon { width: 34px; padding: 0; font-size: 13px; }

    /* drawer */
    .mod__drawer { display: flex; flex-direction: column; gap: 14px; padding-top: 14px; margin-top: 4px; border-top: 1px solid var(--line); }
    .mod__block-lbl {
      font-size: 9px;
      letter-spacing: 2px;
      color: var(--text-dim);
      margin-bottom: 6px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .muted { color: var(--text-faint); font-size: 10px; letter-spacing: 0.5px; text-transform: none; }
    .err   { color: var(--red); font-size: 10px; letter-spacing: 0.5px; text-transform: none; }
    .code, .preview {
      background: var(--code-bg);
      padding: 10px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: var(--text);
      margin: 0;
      white-space: pre-wrap;
      border-left: 2px solid var(--line-strong);
      line-height: 1.55;
      border-radius: 2px;
    }
    .preview { font-size: 10px; max-height: 180px; overflow: auto; color: var(--text-dim); }
    .mod__score-row { display: flex; gap: 10px; align-items: end; }
    .mod__score-row .cmd-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .mod__score-row .cmd-field span {
      font-family: 'Orbitron', monospace;
      font-size: 9px;
      letter-spacing: 2px;
      color: var(--text-dim);
      text-transform: uppercase;
    }
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
