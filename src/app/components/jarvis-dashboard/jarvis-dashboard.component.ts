import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentsService } from '../../services/agents.service';
import { InvocationLog, LogForm } from '../../models/agent.model';

@Component({
  selector: 'app-jarvis-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="bridge">

    <!-- HEADER -->
    <header class="bridge__hdr arc-stagger">
      <div class="bridge__id">
        <h1 class="arc-title bridge__id-name">Command Bridge</h1>
        <div class="bridge__id-meta arc-mono">
          <span>{{ svc.currentSprint() }}</span>
          <span class="dot-sep">·</span>
          <span>Operator: {{ svc.currentUser() }}</span>
          <span class="dot-sep">·</span>
          <span>{{ today() }}</span>
        </div>
      </div>
      <div class="bridge__cmd">
        <label class="cmd-field">
          <span>Sprint</span>
          <select class="arc-input"
                  [ngModel]="svc.currentSprint()"
                  (ngModelChange)="svc.currentSprint.set($event); svc.persist()"
                  data-testid="sprint-select">
            <option *ngFor="let s of sprints">{{ s }}</option>
          </select>
        </label>
        <label class="cmd-field">
          <span>Operator</span>
          <select class="arc-input"
                  [ngModel]="svc.currentUser()"
                  (ngModelChange)="svc.currentUser.set($event); svc.persist()">
            <option *ngFor="let u of users">{{ u }}</option>
          </select>
        </label>
        <label class="cmd-field cmd-field--sm">
          <span>Squad</span>
          <input class="arc-input" type="number" min="1" max="100"
                 [ngModel]="svc.teamSize()"
                 (ngModelChange)="svc.teamSize.set(+$event); svc.persist()"/>
        </label>
        <button class="arc-btn arc-btn--sm" (click)="pisOpen.set(true)" data-testid="pis-btn">PIS Sync</button>
        <button class="arc-btn arc-btn--sm arc-btn--amber" (click)="svc.exportDigest()" data-testid="export-btn">Export</button>
      </div>
    </header>

    <!-- HERO GAUGES -->
    <section class="gauges arc-stagger">
      <div class="gauge" *ngFor="let g of gauges()">
        <svg viewBox="0 0 120 80" class="gauge__svg">
          <path d="M 12 70 A 48 48 0 0 1 108 70" fill="none" stroke="var(--line)" stroke-width="3" stroke-linecap="round"/>
          <path d="M 12 70 A 48 48 0 0 1 108 70" fill="none"
                [attr.stroke]="g.color"
                stroke-width="3" stroke-linecap="round"
                stroke-dasharray="150"
                [attr.stroke-dashoffset]="150 - (150 * g.pct / 100)"
                style="transition: stroke-dashoffset 1.4s cubic-bezier(.16,.84,.44,1);"/>
        </svg>
        <div class="gauge__num arc-mono">{{ g.value }}<span class="gauge__unit">{{ g.unit }}</span></div>
        <div class="gauge__lbl arc-title">{{ g.label }}</div>
        <div class="gauge__sub arc-mono">{{ g.sub }}</div>
      </div>
    </section>

    <!-- 3-COL GRID -->
    <section class="grid arc-stagger">

      <!-- RANKINGS -->
      <article class="arc-panel panel">
        <div class="arc-panel__title">Agent Rankings · Top 10</div>
        <div class="panel__body">
          <div class="rank" *ngFor="let r of rankings(); let i = index">
            <span class="rank__pos arc-mono">{{ (i + 1).toString().padStart(2, '0') }}</span>
            <span class="rank__dot" [style.background]="r.accent"></span>
            <div class="rank__body">
              <div class="rank__name">{{ r.name }}</div>
              <div class="rank__meta arc-mono">{{ r.domain }} · {{ r.runs }} ops · {{ r.timeHr }}h saved</div>
              <div class="rank__bar"><span [style.width.%]="r.healthPct" [style.background]="r.accent"></span></div>
            </div>
            <span class="rank__score arc-data">{{ r.healthPct }}</span>
          </div>
          <p *ngIf="rankings().length === 0" class="empty arc-mono">No telemetry · log an operation to begin</p>
        </div>
      </article>

      <!-- TEAM + PIS -->
      <article class="arc-panel panel">
        <div class="arc-panel__title">Squad Adoption</div>
        <div class="panel__body">
          <div class="member" *ngFor="let m of svc.teamStats()">
            <div class="member__row">
              <span class="member__name">{{ m.user }}</span>
              <span class="arc-data">{{ m.runs }} ops</span>
            </div>
            <div class="member__row member__row--meta arc-mono">
              <span>{{ m.uniqueAgents }} agents · {{ (m.timeSavedMin / 60).toFixed(1) }}h</span>
              <span class="arc-data">{{ m.breadth }}%</span>
            </div>
            <div class="member__bar"><span [style.width.%]="m.breadth"></span></div>
          </div>
          <p *ngIf="svc.teamStats().length === 0" class="empty arc-mono">No squad activity</p>
        </div>

        <div class="arc-panel__title arc-panel__title--mt">Personal Intel System</div>
        <div class="panel__body">
          <div class="pis">
            <div class="pis__title">
              <span class="pis__title-name">{{ svc.pisState().projectName }}</span>
              <span class="arc-chip arc-chip--amber">{{ svc.pisState().version }}</span>
            </div>
            <div class="pis__progress">
              <div class="pis__bar"><span [style.width.%]="svc.pisState().progressToV1"></span></div>
              <div class="pis__meta arc-mono">
                {{ svc.pisState().progressToV1 }}% to v1.0 · {{ svc.pisState().sessionsLogged }} sessions
              </div>
            </div>
            <div class="pis__area" *ngFor="let a of svc.pisState().areas">
              <span class="pis__area-name">{{ a.name }}</span>
              <div class="pis__area-bar"><span [style.width.%]="a.maturity"></span></div>
              <span class="pis__area-pct arc-data">{{ a.maturity }}</span>
            </div>
          </div>
        </div>
      </article>

      <!-- ROI RADAR + FEED -->
      <article class="arc-panel panel">
        <div class="arc-panel__title">Sprint ROI · {{ svc.currentSprint() }}</div>
        <div class="panel__body">
          <div class="roi-wrap">
            <svg viewBox="0 0 240 200" class="radar">
              <polygon *ngFor="let r of radarRings"
                       [attr.points]="radarPoints(r)"
                       fill="none" stroke="var(--line)" stroke-width="0.7"/>
              <line *ngFor="let p of radarPoints(1).split(' '); let i = index"
                    x1="120" y1="100"
                    [attr.x2]="p.split(',')[0]"
                    [attr.y2]="p.split(',')[1]"
                    stroke="var(--line)" stroke-width="0.7"/>
              <polygon [attr.points]="radarDataPoints()"
                       fill="var(--teal)" fill-opacity="0.14"
                       stroke="var(--teal)" stroke-width="1.2"/>
              <circle *ngFor="let pt of radarDataVertices()"
                      [attr.cx]="pt.x" [attr.cy]="pt.y" r="2.5"
                      fill="var(--copper)"/>
              <text *ngFor="let l of radarLabels(); let i = index"
                    [attr.x]="l.x" [attr.y]="l.y"
                    text-anchor="middle" class="radar__lbl">{{ l.text }}</text>
            </svg>
            <div class="roi-meta">
              <div class="roi-meta__cell">
                <div class="roi-meta__num arc-data">{{ svc.sprintMetrics().timeSavedHours }}h</div>
                <div class="roi-meta__lbl arc-mono">Time saved</div>
              </div>
              <div class="roi-meta__cell">
                <div class="roi-meta__num arc-data">{{ svc.sprintMetrics().prevented }}</div>
                <div class="roi-meta__lbl arc-mono">Prevented</div>
              </div>
              <div class="roi-meta__cell">
                <div class="roi-meta__num arc-data">{{ svc.sprintMetrics().actionRate }}%</div>
                <div class="roi-meta__lbl arc-mono">Act rate</div>
              </div>
              <div class="roi-meta__cell">
                <div class="roi-meta__num arc-data">{{ svc.sprintMetrics().runs }}</div>
                <div class="roi-meta__lbl arc-mono">Ops</div>
              </div>
            </div>
          </div>
        </div>

        <div class="arc-panel__title arc-panel__title--mt">Live Feed</div>
        <div class="panel__body feed-body">
          <div class="feed" *ngFor="let l of recentFeed()">
            <span class="feed__dot" [style.background]="l.accent"></span>
            <div class="feed__main">
              <div class="feed__name">{{ l.agentName }}</div>
              <div class="feed__meta arc-mono">{{ l.user }} · {{ relTime(l.timestamp) }}</div>
            </div>
            <span class="arc-chip" [class]="outcomeChip(l.outcome)">{{ l.outcome }}</span>
          </div>
          <p *ngIf="recentFeed().length === 0" class="empty arc-mono">No activity · standing by</p>
        </div>
      </article>
    </section>

    <!-- FAB -->
    <button class="fab" (click)="logOpen.set(true)" data-testid="fab-log">
      <span class="fab__plus">+</span>
      <span class="fab__label arc-title">Log Op</span>
    </button>

    <!-- LOG MODAL -->
    <div class="modal" *ngIf="logOpen()" (click)="logOpen.set(false)">
      <div class="modal__box" (click)="$event.stopPropagation()">
        <h3 class="modal__title arc-title">Log Operation</h3>
        <label class="cmd-field">
          <span>Agent</span>
          <select class="arc-input" [(ngModel)]="form.agentId">
            <option value="" disabled>Select an agent…</option>
            <option *ngFor="let a of svc.agents()" [value]="a.id">{{ a.name }}</option>
          </select>
        </label>
        <label class="cmd-field">
          <span>Outcome</span>
          <select class="arc-input" [(ngModel)]="form.outcome">
            <option value="success">Success — actionable findings</option>
            <option value="partial">Partial — some value</option>
            <option value="noissue">No issue — clean</option>
            <option value="failed">Failed — no value</option>
          </select>
        </label>
        <div class="modal__row">
          <label class="cmd-field"><span>Findings</span><input class="arc-input" type="number" min="0" [(ngModel)]="form.findingCount"/></label>
          <label class="cmd-field"><span>Actioned</span><input class="arc-input" type="number" min="0" [(ngModel)]="form.actioned"/></label>
          <label class="cmd-field"><span>Dismissed</span><input class="arc-input" type="number" min="0" [(ngModel)]="form.dismissed"/></label>
        </div>
        <div class="modal__row modal__row--end">
          <button class="arc-btn arc-btn--ghost arc-btn--sm" (click)="logOpen.set(false)">Cancel</button>
          <button class="arc-btn arc-btn--amber" (click)="submitLog()" [disabled]="!form.agentId" data-testid="submit-log">
            Commit
          </button>
        </div>
      </div>
    </div>

    <!-- PIS MODAL -->
    <div class="modal" *ngIf="pisOpen()" (click)="pisOpen.set(false)">
      <div class="modal__box" (click)="$event.stopPropagation()">
        <h3 class="modal__title arc-title">PIS Sync</h3>
        <label class="cmd-field"><span>Project</span><input class="arc-input" [(ngModel)]="pisDraft.projectName"/></label>
        <label class="cmd-field"><span>Version</span><input class="arc-input" [(ngModel)]="pisDraft.version"/></label>
        <label class="cmd-field"><span>Sessions logged</span><input class="arc-input" type="number" min="0" [(ngModel)]="pisDraft.sessionsLogged"/></label>
        <label class="cmd-field"><span>Progress to v1.0 (%)</span><input class="arc-input" type="number" min="0" max="100" [(ngModel)]="pisDraft.progressToV1"/></label>
        <div class="modal__row modal__row--end">
          <button class="arc-btn arc-btn--ghost arc-btn--sm" (click)="pisOpen.set(false)">Cancel</button>
          <button class="arc-btn" (click)="submitPis()">Sync</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div class="toast" *ngIf="toast()">
      <span class="toast__dot"></span>
      <span>{{ toast() }}</span>
    </div>
  </div>
  `,
  styles: [`
    :host { display: block; position: relative; z-index: 1; }

    .bridge { padding: 36px 48px 120px; display: flex; flex-direction: column; gap: 36px; max-width: 1600px; margin: 0 auto; }

    /* header */
    .bridge__hdr {
      display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--line);
    }
    .bridge__id-name {
      font-family: 'Orbitron', monospace;
      font-size: 26px;
      font-weight: 600;
      letter-spacing: 4px;
      color: var(--text);
      margin: 0;
      text-transform: none;
    }
    .bridge__id-meta {
      display: flex; gap: 10px; align-items: center;
      font-size: 11px;
      color: var(--text-dim);
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .dot-sep { color: var(--text-mute); }
    .bridge__cmd { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; }
    .cmd-field { display: flex; flex-direction: column; gap: 6px; }
    .cmd-field > span {
      font-family: 'Orbitron', monospace;
      font-size: 9px;
      letter-spacing: 2.5px;
      color: var(--text-dim);
      text-transform: uppercase;
    }
    .cmd-field select, .cmd-field input { min-width: 130px; }
    .cmd-field--sm select, .cmd-field--sm input { min-width: 70px; }

    /* gauges */
    .gauges { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; }
    .gauge {
      background: var(--panel);
      border: 1px solid var(--line);
      padding: 22px 18px 18px;
      text-align: center;
      backdrop-filter: blur(8px);
      border-radius: 2px;
      transition: border-color .4s ease;
    }
    .gauge:hover { border-color: var(--line-strong); }
    .gauge__svg { width: 100%; max-width: 130px; height: auto; display: block; margin: 0 auto; }
    .gauge__num {
      font-size: 28px;
      font-weight: 700;
      color: var(--text);
      margin-top: -10px;
      line-height: 1;
    }
    .gauge__unit { font-size: 11px; color: var(--text-dim); margin-left: 4px; font-weight: 500; }
    .gauge__lbl { font-size: 10px; color: var(--text-dim); margin-top: 10px; letter-spacing: 2.5px; }
    .gauge__sub { font-size: 9px; color: var(--text-faint); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }

    /* grid */
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 22px; }
    @media (max-width: 1200px) { .grid { grid-template-columns: 1fr; } .gauges { grid-template-columns: repeat(2, 1fr); } }

    .panel { display: flex; flex-direction: column; }
    .panel__body { padding: 18px 20px; }
    .arc-panel__title--mt { border-top: 1px solid var(--line); }

    /* rankings */
    .rank {
      display: grid;
      grid-template-columns: 26px 8px 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--line);
    }
    .rank:last-child { border-bottom: 0; }
    .rank__pos { font-size: 11px; color: var(--text-faint); }
    .rank__dot { width: 6px; height: 6px; border-radius: 50%; }
    .rank__name { font-size: 13px; font-weight: 600; color: var(--text); }
    .rank__meta { font-size: 10px; color: var(--text-dim); margin-top: 2px; letter-spacing: 1px; text-transform: uppercase; }
    .rank__bar { margin-top: 8px; height: 2px; background: var(--line); overflow: hidden; }
    .rank__bar span { display: block; height: 100%; transition: width 1s ease; }
    .rank__score { font-size: 16px; color: var(--text); font-weight: 600; }

    /* members */
    .member { padding: 12px 0; border-bottom: 1px solid var(--line); }
    .member:last-child { border-bottom: 0; }
    .member__row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
    .member__row--meta { font-size: 10px; color: var(--text-dim); margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .member__name { color: var(--text); font-weight: 600; }
    .member__bar { margin-top: 8px; height: 2px; background: var(--line); overflow: hidden; }
    .member__bar span { display: block; height: 100%; background: var(--copper); transition: width 1s ease; }

    /* PIS */
    .pis { display: flex; flex-direction: column; gap: 14px; }
    .pis__title { display: flex; gap: 12px; align-items: center; }
    .pis__title-name { font-size: 14px; font-weight: 600; color: var(--text); }
    .pis__progress { display: flex; flex-direction: column; gap: 8px; }
    .pis__bar { height: 3px; background: var(--line); overflow: hidden; }
    .pis__bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--teal), var(--copper)); transition: width 1.2s ease; }
    .pis__meta { font-size: 10px; letter-spacing: 1.5px; color: var(--text-dim); text-transform: uppercase; }
    .pis__area { display: grid; grid-template-columns: 110px 1fr 32px; gap: 12px; align-items: center; font-size: 11px; padding: 6px 0; }
    .pis__area-name { color: var(--text-dim); font-size: 11px; }
    .pis__area-bar { height: 2px; background: var(--line); overflow: hidden; }
    .pis__area-bar span { display: block; height: 100%; background: var(--teal); transition: width 1s ease; }
    .pis__area-pct { text-align: right; font-size: 11px; }

    /* ROI radar */
    .roi-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: center; }
    @media (max-width: 1400px) { .roi-wrap { grid-template-columns: 1fr; } }
    .radar { width: 100%; height: auto; max-height: 220px; }
    .radar__lbl {
      font-family: 'Orbitron', monospace;
      font-size: 8px;
      fill: var(--text-dim);
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .roi-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .roi-meta__cell {
      border: 1px solid var(--line);
      padding: 14px 10px;
      text-align: center;
      border-radius: 2px;
    }
    .roi-meta__num { font-size: 22px; }
    .roi-meta__lbl { font-size: 9px; color: var(--text-dim); margin-top: 4px; letter-spacing: 2px; text-transform: uppercase; }

    /* feed */
    .feed-body { max-height: 240px; overflow-y: auto; }
    .feed {
      display: grid;
      grid-template-columns: 8px 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--line);
    }
    .feed:last-child { border-bottom: 0; }
    .feed__dot { width: 6px; height: 6px; border-radius: 50%; }
    .feed__name { font-size: 13px; font-weight: 600; color: var(--text); }
    .feed__meta { font-size: 10px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }

    /* empty */
    .empty {
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--text-faint);
      text-align: center;
      padding: 20px 0;
      text-transform: uppercase;
    }

    /* FAB */
    .fab {
      position: fixed;
      right: 36px;
      bottom: 60px;
      display: flex; align-items: center; gap: 10px;
      padding: 14px 22px;
      background: var(--copper);
      border: 0;
      color: #fff;
      cursor: pointer;
      z-index: 70;
      border-radius: 2px;
      box-shadow: 0 6px 24px rgba(180, 83, 9, .25), 0 1px 2px rgba(0,0,0,.15);
      transition: all .3s ease;
    }
    .fab:hover { transform: translateY(-1px); background: var(--copper-deep); box-shadow: 0 10px 32px rgba(180, 83, 9, .35); }
    .fab__plus { font-size: 16px; font-weight: 400; }
    .fab__label { font-size: 10px; letter-spacing: 2px; }

    /* modal */
    .modal {
      position: fixed; inset: 0;
      background: rgba(10, 16, 32, .58);
      backdrop-filter: blur(6px);
      display: grid; place-items: center;
      z-index: 200;
      animation: modal-fade .35s ease;
    }
    @keyframes modal-fade { from { opacity: 0; } to { opacity: 1; } }
    .modal__box {
      background: var(--panel-solid);
      border: 1px solid var(--line);
      padding: 32px;
      width: min(480px, 92vw);
      display: flex; flex-direction: column; gap: 16px;
      box-shadow: 0 24px 64px rgba(0,0,0,.18);
      border-radius: 2px;
      animation: modal-rise .4s cubic-bezier(.16,.84,.44,1);
    }
    @keyframes modal-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; } }
    .modal__title {
      margin: 0 0 8px;
      font-size: 16px;
      color: var(--text);
      letter-spacing: 3px;
    }
    .modal__row { display: flex; gap: 12px; }
    .modal__row .cmd-field { flex: 1; }
    .modal__row--end { justify-content: flex-end; }

    /* toast */
    .toast {
      position: fixed;
      bottom: 130px; right: 36px;
      padding: 12px 20px;
      background: var(--panel-solid);
      border: 1px solid var(--line-strong);
      color: var(--text);
      display: flex; gap: 12px; align-items: center;
      z-index: 250;
      box-shadow: 0 8px 24px rgba(0,0,0,.12);
      border-radius: 2px;
      font-size: 12px;
      letter-spacing: 1px;
      animation: toast-in .35s cubic-bezier(.16,.84,.44,1);
    }
    .toast__dot { width: 6px; height: 6px; background: var(--teal); border-radius: 50%; }
    @keyframes toast-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; } }
  `]
})
export class JarvisDashboardComponent {
  svc = inject(AgentsService);

  sprints = ['Sprint-10', 'Sprint-11', 'Sprint-12', 'Sprint-13', 'Sprint-14'];
  users = ['me', 'alex', 'priya', 'sam', 'noah', 'maya'];

  logOpen = signal(false);
  pisOpen = signal(false);
  toast = signal<string>('');

  form: LogForm = { agentId: '', outcome: 'success', findingCount: 3, actioned: 2, dismissed: 1 };
  pisDraft = { ...this.svc.pisState() };

  radarRings = [0.25, 0.5, 0.75, 1];

  today = computed(() => new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }));

  gauges = computed(() => {
    const m = this.svc.sprintMetrics();
    const wk = this.svc.weeklyInvocations();
    return [
      { label: 'Weekly Ops',  value: wk,                              unit: '',  sub: 'Last 7 days',    pct: Math.min(100, wk * 10),                            color: 'var(--teal)' },
      { label: 'Time Saved',  value: this.svc.totalTimeSavedHours(),  unit: 'h', sub: 'All time',       pct: Math.min(100, this.svc.totalTimeSavedHours()),     color: 'var(--teal)' },
      { label: 'Prevented',   value: this.svc.totalPrevented(),       unit: '',  sub: 'Actioned',       pct: Math.min(100, this.svc.totalPrevented() * 5),      color: 'var(--copper)' },
      { label: 'Adoption',    value: this.svc.adoptionRate(),         unit: '%', sub: `${this.svc.activeUsers()}/${this.svc.teamSize()} active`, pct: this.svc.adoptionRate(), color: 'var(--teal)' },
      { label: 'Total Ops',   value: this.svc.totalInvocations(),     unit: '',  sub: 'Cumulative',     pct: Math.min(100, this.svc.totalInvocations() * 2),    color: 'var(--copper)' }
    ];
  });

  rankings = computed(() => {
    const metrics = this.svc.agentMetrics();
    return this.svc.agents()
      .map(a => {
        const m = metrics[a.id];
        const g = this.svc.getGroup(a.group);
        const healthPct = Math.min(100, m.runs * 8 + m.actionRate / 2);
        return {
          id: a.id, name: a.name, domain: a.group,
          accent: g?.accent ?? 'var(--teal)',
          runs: m.runs,
          timeHr: Math.round(m.timeSavedMin / 60 * 10) / 10,
          healthPct: Math.round(healthPct)
        };
      })
      .filter(r => r.runs > 0)
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 10);
  });

  recentFeed = computed<InvocationLog[]>(() => this.svc.logs().slice(0, 8));

  private get radarAxes() {
    const m = this.svc.sprintMetrics();
    const all = this.svc;
    return [
      { label: 'Ops',       value: Math.min(1, m.runs / 30) },
      { label: 'Time',      value: Math.min(1, m.timeSavedHours / 40) },
      { label: 'Prevented', value: Math.min(1, m.prevented / 25) },
      { label: 'Act rate',  value: m.actionRate / 100 },
      { label: 'Squad',     value: all.adoptionRate() / 100 },
      { label: 'Breadth',   value: Math.min(1, all.teamStats().reduce((s, t) => s + t.uniqueAgents, 0) / 40) }
    ];
  }

  radarPoints(scale = 1): string {
    const cx = 120, cy = 100, r = 70 * scale;
    return this.radarAxes.map((_, i, arr) => {
      const a = (Math.PI * 2 * i / arr.length) - Math.PI / 2;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  }

  radarDataPoints(): string {
    const cx = 120, cy = 100, rMax = 70;
    return this.radarAxes.map((ax, i, arr) => {
      const a = (Math.PI * 2 * i / arr.length) - Math.PI / 2;
      const r = rMax * Math.max(0.05, ax.value);
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  }

  radarDataVertices(): { x: number; y: number }[] {
    const cx = 120, cy = 100, rMax = 70;
    return this.radarAxes.map((ax, i, arr) => {
      const a = (Math.PI * 2 * i / arr.length) - Math.PI / 2;
      const r = rMax * Math.max(0.05, ax.value);
      return { x: +(cx + r * Math.cos(a)).toFixed(1), y: +(cy + r * Math.sin(a)).toFixed(1) };
    });
  }

  radarLabels(): { x: number; y: number; text: string }[] {
    const cx = 120, cy = 100, r = 90;
    return this.radarAxes.map((ax, i, arr) => {
      const a = (Math.PI * 2 * i / arr.length) - Math.PI / 2;
      return { x: +(cx + r * Math.cos(a)).toFixed(1), y: +(cy + r * Math.sin(a) + 3).toFixed(1), text: ax.label };
    });
  }

  outcomeChip(o: InvocationLog['outcome']): string {
    return o === 'success' ? 'arc-chip arc-chip--green'
         : o === 'partial' ? 'arc-chip arc-chip--amber'
         : o === 'noissue' ? 'arc-chip'
                           : 'arc-chip arc-chip--red';
  }

  submitLog(): void {
    const entry = this.svc.logInvocation(this.form);
    if (entry) {
      this.flash(`Logged · ${entry.agentName}`);
      this.form = { agentId: '', outcome: 'success', findingCount: 3, actioned: 2, dismissed: 1 };
      this.logOpen.set(false);
    }
  }

  submitPis(): void {
    this.svc.updatePisState(this.pisDraft);
    this.flash('PIS synchronised');
    this.pisOpen.set(false);
  }

  relTime(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  private flash(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2400);
  }
}
