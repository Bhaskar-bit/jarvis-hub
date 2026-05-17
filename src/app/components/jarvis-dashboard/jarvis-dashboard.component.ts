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
  <div class="bridge arc-stagger">

    <!-- HEADER STRIP -->
    <header class="bridge__hdr">
      <div class="bridge__id">
        <span class="arc-title bridge__id-name">COMMAND BRIDGE</span>
        <span class="arc-mono bridge__id-meta">SECTOR / {{ svc.currentSprint() }} · OPS {{ svc.currentUser() }}</span>
      </div>
      <div class="bridge__cmd">
        <label class="cmd-field">
          <span>SPRINT</span>
          <select class="arc-input"
                  [ngModel]="svc.currentSprint()"
                  (ngModelChange)="svc.currentSprint.set($event); svc.persist()"
                  data-testid="sprint-select">
            <option *ngFor="let s of sprints">{{ s }}</option>
          </select>
        </label>
        <label class="cmd-field">
          <span>OPERATOR</span>
          <select class="arc-input"
                  [ngModel]="svc.currentUser()"
                  (ngModelChange)="svc.currentUser.set($event); svc.persist()">
            <option *ngFor="let u of users">{{ u }}</option>
          </select>
        </label>
        <label class="cmd-field cmd-field--sm">
          <span>SQUAD</span>
          <input class="arc-input" type="number" min="1" max="100"
                 [ngModel]="svc.teamSize()"
                 (ngModelChange)="svc.teamSize.set(+$event); svc.persist()"/>
        </label>
        <button class="arc-btn arc-btn--sm" (click)="pisOpen.set(true)" data-testid="pis-btn">⌬ PIS SYNC</button>
        <button class="arc-btn arc-btn--sm arc-btn--amber" (click)="svc.exportDigest()" data-testid="export-btn">▼ EXPORT</button>
      </div>
    </header>

    <!-- HERO GAUGES -->
    <section class="gauges arc-stagger">
      <div class="gauge arc-frame--4" *ngFor="let g of gauges()">
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>

        <svg viewBox="0 0 120 80" class="gauge__svg">
          <path d="M 12 70 A 48 48 0 0 1 108 70" fill="none" stroke="rgba(34,211,238,.12)" stroke-width="6" stroke-linecap="round"/>
          <path d="M 12 70 A 48 48 0 0 1 108 70" fill="none"
                [attr.stroke]="g.color"
                stroke-width="6" stroke-linecap="round"
                stroke-dasharray="150"
                [attr.stroke-dashoffset]="150 - (150 * g.pct / 100)"
                style="transition: stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1); filter: drop-shadow(0 0 6px currentColor);"/>
          <text x="60" y="56" text-anchor="middle" class="gauge__num arc-mono"
                [attr.fill]="g.color">{{ g.value }}</text>
          <text x="60" y="72" text-anchor="middle" class="gauge__unit">{{ g.unit }}</text>
        </svg>

        <div class="gauge__lbl arc-title">{{ g.label }}</div>
        <div class="gauge__sub arc-mono">{{ g.sub }}</div>
      </div>
    </section>

    <!-- 3-COL GRID -->
    <section class="grid">

      <!-- RANKINGS -->
      <article class="arc-panel arc-frame--4 panel">
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <div class="arc-panel__title">⚙ AGENT RANKINGS · TOP 10</div>
        <div class="panel__body">
          <div class="rank arc-stagger">
            <div class="rank__row" *ngFor="let r of rankings(); let i = index">
              <span class="rank__pos arc-mono">#{{ (i + 1).toString().padStart(2, '0') }}</span>
              <span class="rank__dot" [style.background]="r.accent" [style.box-shadow]="'0 0 8px ' + r.accent"></span>
              <div class="rank__body">
                <div class="rank__name">{{ r.name }}</div>
                <div class="rank__meta arc-mono">{{ r.domain }} · {{ r.runs }} OPS · {{ r.timeHr }}H SAVED</div>
                <div class="rank__bar">
                  <span [style.width.%]="r.healthPct" [style.background]="r.accent"></span>
                </div>
              </div>
              <span class="rank__score arc-data">{{ r.healthPct }}</span>
            </div>
          </div>
          <p *ngIf="rankings().length === 0" class="empty">NO TELEMETRY · LOG AN OPERATION</p>
        </div>
      </article>

      <!-- TEAM + PIS -->
      <article class="arc-panel arc-frame--4 panel">
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <div class="arc-panel__title">⌥ SQUAD ADOPTION</div>
        <div class="panel__body">
          <div class="member" *ngFor="let m of svc.teamStats()">
            <div class="member__row">
              <span class="member__name">{{ m.user }}</span>
              <span class="arc-data">{{ m.runs }} OPS</span>
            </div>
            <div class="member__row member__row--meta">
              <span class="arc-mono">{{ m.uniqueAgents }} agents · {{ (m.timeSavedMin / 60).toFixed(1) }}h</span>
              <span class="arc-data">{{ m.breadth }}%</span>
            </div>
            <div class="member__bar"><span [style.width.%]="m.breadth"></span></div>
          </div>
          <p *ngIf="svc.teamStats().length === 0" class="empty">NO SQUAD ACTIVITY</p>
        </div>

        <div class="arc-panel__title arc-panel__title--mt">◉ PERSONAL INTEL SYSTEM</div>
        <div class="panel__body">
          <div class="pis">
            <div class="pis__title">
              <span class="arc-glow-text">{{ svc.pisState().projectName }}</span>
              <span class="arc-chip arc-chip--amber">{{ svc.pisState().version }}</span>
            </div>
            <div class="pis__progress">
              <div class="pis__bar"><span [style.width.%]="svc.pisState().progressToV1"></span></div>
              <div class="pis__meta arc-mono">
                {{ svc.pisState().progressToV1 }}% → V1.0 · {{ svc.pisState().sessionsLogged }} SESSIONS
              </div>
            </div>
            <div class="pis__area" *ngFor="let a of svc.pisState().areas">
              <span class="pis__area-name arc-mono">{{ a.name }}</span>
              <div class="pis__area-bar"><span [style.width.%]="a.maturity"></span></div>
              <span class="pis__area-pct arc-data">{{ a.maturity }}</span>
            </div>
          </div>
        </div>
      </article>

      <!-- ROI RADAR + FEED -->
      <article class="arc-panel arc-frame--4 panel">
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <div class="arc-panel__title">▲ SPRINT ROI · {{ svc.currentSprint() }}</div>
        <div class="panel__body">
          <div class="roi-wrap">
            <svg viewBox="0 0 240 200" class="radar">
              <!-- grid rings -->
              <polygon *ngFor="let r of radarRings"
                       [attr.points]="radarPoints(r)"
                       fill="none" stroke="rgba(34,211,238,.18)" stroke-width="0.8"/>
              <!-- axes -->
              <line *ngFor="let p of radarPoints(1).split(' '); let i = index"
                    x1="120" y1="100"
                    [attr.x2]="p.split(',')[0]"
                    [attr.y2]="p.split(',')[1]"
                    stroke="rgba(34,211,238,.18)" stroke-width="0.8"/>
              <!-- data polygon -->
              <polygon [attr.points]="radarDataPoints()"
                       fill="rgba(34,211,238,.22)"
                       stroke="#22d3ee" stroke-width="1.5"
                       style="filter: drop-shadow(0 0 8px #22d3ee);"/>
              <!-- vertex dots -->
              <circle *ngFor="let pt of radarDataVertices()"
                      [attr.cx]="pt.x" [attr.cy]="pt.y" r="3"
                      fill="#f59e0b" style="filter: drop-shadow(0 0 6px #f59e0b);"/>
              <!-- axis labels -->
              <text *ngFor="let l of radarLabels(); let i = index"
                    [attr.x]="l.x" [attr.y]="l.y"
                    text-anchor="middle" class="radar__lbl">{{ l.text }}</text>
            </svg>
            <div class="roi-meta arc-stagger">
              <div class="roi-meta__cell">
                <div class="arc-data roi-meta__num">{{ svc.sprintMetrics().timeSavedHours }}H</div>
                <div class="roi-meta__lbl arc-mono">TIME SAVED</div>
              </div>
              <div class="roi-meta__cell">
                <div class="arc-data roi-meta__num">{{ svc.sprintMetrics().prevented }}</div>
                <div class="roi-meta__lbl arc-mono">PREVENTED</div>
              </div>
              <div class="roi-meta__cell">
                <div class="arc-data roi-meta__num">{{ svc.sprintMetrics().actionRate }}%</div>
                <div class="roi-meta__lbl arc-mono">ACT RATE</div>
              </div>
              <div class="roi-meta__cell">
                <div class="arc-data roi-meta__num">{{ svc.sprintMetrics().runs }}</div>
                <div class="roi-meta__lbl arc-mono">OPS</div>
              </div>
            </div>
          </div>
        </div>

        <div class="arc-panel__title arc-panel__title--mt">⌷ LIVE FEED</div>
        <div class="panel__body feed-body">
          <div class="feed arc-stagger">
            <div class="feed__row" *ngFor="let l of recentFeed()">
              <span class="feed__dot" [style.background]="l.accent"
                    [style.box-shadow]="'0 0 8px ' + l.accent"></span>
              <div class="feed__main">
                <div class="feed__name">{{ l.agentName }}</div>
                <div class="feed__meta arc-mono">{{ l.user }} · {{ relTime(l.timestamp) }}</div>
              </div>
              <span class="arc-chip" [class]="outcomeChip(l.outcome)">{{ l.outcome }}</span>
            </div>
          </div>
          <p *ngIf="recentFeed().length === 0" class="empty">NO ACTIVITY · STANDING BY</p>
        </div>
      </article>
    </section>

    <!-- TICKER -->
    <div class="ticker" *ngIf="tickerText()">
      <div class="ticker__track arc-mono">
        <span>{{ tickerText() }}</span>
        <span>{{ tickerText() }}</span>
      </div>
    </div>

    <!-- FAB -->
    <button class="fab arc-frame" (click)="logOpen.set(true)" data-testid="fab-log">
      <span class="fab__plus">+</span>
      <span class="fab__label arc-title">LOG OP</span>
    </button>

    <!-- LOG MODAL -->
    <div class="modal" *ngIf="logOpen()" (click)="logOpen.set(false)">
      <div class="modal__box arc-frame--4" (click)="$event.stopPropagation()">
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <h3 class="modal__title arc-title">▶ LOG OPERATION</h3>
        <label class="cmd-field">
          <span>AGENT</span>
          <select class="arc-input" [(ngModel)]="form.agentId">
            <option value="" disabled>· SELECT ·</option>
            <option *ngFor="let a of svc.agents()" [value]="a.id">{{ a.name }}</option>
          </select>
        </label>
        <label class="cmd-field">
          <span>OUTCOME</span>
          <select class="arc-input" [(ngModel)]="form.outcome">
            <option value="success">SUCCESS · actionable</option>
            <option value="partial">PARTIAL · some value</option>
            <option value="noissue">NO ISSUE · clean</option>
            <option value="failed">FAILED · no value</option>
          </select>
        </label>
        <div class="modal__row">
          <label class="cmd-field"><span>FINDINGS</span><input class="arc-input" type="number" min="0" [(ngModel)]="form.findingCount"/></label>
          <label class="cmd-field"><span>ACTIONED</span><input class="arc-input" type="number" min="0" [(ngModel)]="form.actioned"/></label>
          <label class="cmd-field"><span>DISMISSED</span><input class="arc-input" type="number" min="0" [(ngModel)]="form.dismissed"/></label>
        </div>
        <div class="modal__row modal__row--end">
          <button class="arc-btn arc-btn--ghost arc-btn--sm" (click)="logOpen.set(false)">CANCEL</button>
          <button class="arc-btn arc-btn--amber" (click)="submitLog()" [disabled]="!form.agentId" data-testid="submit-log">
            ▶ COMMIT
          </button>
        </div>
      </div>
    </div>

    <!-- PIS MODAL -->
    <div class="modal" *ngIf="pisOpen()" (click)="pisOpen.set(false)">
      <div class="modal__box arc-frame--4" (click)="$event.stopPropagation()">
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <span class="arc-frame-corner"></span><span class="arc-frame-corner"></span>
        <h3 class="modal__title arc-title">⌬ PIS SYNC</h3>
        <label class="cmd-field"><span>PROJECT</span><input class="arc-input" [(ngModel)]="pisDraft.projectName"/></label>
        <label class="cmd-field"><span>VERSION</span><input class="arc-input" [(ngModel)]="pisDraft.version"/></label>
        <label class="cmd-field"><span>SESSIONS LOGGED</span><input class="arc-input" type="number" min="0" [(ngModel)]="pisDraft.sessionsLogged"/></label>
        <label class="cmd-field"><span>PROGRESS TO V1.0 (%)</span><input class="arc-input" type="number" min="0" max="100" [(ngModel)]="pisDraft.progressToV1"/></label>
        <div class="modal__row modal__row--end">
          <button class="arc-btn arc-btn--ghost arc-btn--sm" (click)="pisOpen.set(false)">CANCEL</button>
          <button class="arc-btn" (click)="submitPis()">▶ SYNC</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div class="toast arc-frame" *ngIf="toast()">
      <span class="toast__dot"></span>
      <span class="arc-title">{{ toast() }}</span>
    </div>
  </div>
  `,
  styles: [`
    :host { display: block; position: relative; z-index: 1; }

    .bridge { padding: 24px 32px 100px; display: flex; flex-direction: column; gap: 22px; }

    /* header */
    .bridge__hdr {
      display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--line);
    }
    .bridge__id-name { font-size: 22px; color: var(--cyan); text-shadow: 0 0 14px rgba(34,211,238,.4); display: block; }
    .bridge__id-meta { font-size: 10px; color: var(--text-dim); letter-spacing: 2px; text-transform: uppercase; }
    .bridge__cmd { display: flex; gap: 10px; flex-wrap: wrap; align-items: end; }
    .cmd-field { display: flex; flex-direction: column; gap: 4px; }
    .cmd-field span { font-family: 'Orbitron', monospace; font-size: 9px; letter-spacing: 2px; color: var(--text-dim); }
    .cmd-field select, .cmd-field input { min-width: 120px; }
    .cmd-field--sm select, .cmd-field--sm input { min-width: 70px; }

    /* gauges */
    .gauges { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
    .gauge {
      background: linear-gradient(180deg, rgba(34,211,238,.04), transparent 60%), var(--panel);
      border: 1px solid var(--line);
      padding: 14px 12px 12px;
      text-align: center;
      backdrop-filter: blur(6px);
    }
    .gauge__svg { width: 100%; max-width: 140px; height: auto; display: block; margin: 0 auto; }
    .gauge__num { font-size: 22px; font-weight: 700; }
    .gauge__unit { font-family: 'JetBrains Mono', monospace; font-size: 9px; fill: var(--text-dim); letter-spacing: 1.5px; }
    .gauge__lbl { font-size: 10px; color: var(--cyan); margin-top: 4px; }
    .gauge__sub { font-size: 9px; color: var(--text-faint); letter-spacing: 1.5px; text-transform: uppercase; }

    /* grid */
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
    @media (max-width: 1200px) { .grid { grid-template-columns: 1fr; } .gauges { grid-template-columns: repeat(2, 1fr); } }

    .panel { display: flex; flex-direction: column; }
    .panel__body { padding: 12px 14px; }
    .arc-panel__title--mt { margin-top: 0; border-top: 1px solid var(--line); }

    /* rankings */
    .rank { display: flex; flex-direction: column; gap: 8px; }
    .rank__row {
      display: grid;
      grid-template-columns: 26px 10px 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 6px 8px;
      border: 1px solid transparent;
      transition: all .15s;
    }
    .rank__row:hover { border-color: var(--line); background: rgba(34,211,238,.03); }
    .rank__pos { font-size: 11px; color: var(--text-faint); }
    .rank__dot { width: 8px; height: 8px; border-radius: 50%; }
    .rank__name { font-size: 13px; font-weight: 600; color: var(--text); }
    .rank__meta { font-size: 9px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; }
    .rank__bar { margin-top: 5px; height: 2px; background: rgba(34,211,238,.1); overflow: hidden; }
    .rank__bar span { display: block; height: 100%; transition: width .6s ease; box-shadow: 0 0 6px currentColor; }
    .rank__score { font-size: 14px; color: var(--cyan); }

    /* members */
    .member { padding: 8px 0; border-bottom: 1px dashed var(--line); }
    .member:last-child { border-bottom: 0; }
    .member__row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
    .member__row--meta { font-size: 10px; color: var(--text-dim); margin-top: 2px; }
    .member__name { color: var(--text); font-weight: 600; }
    .member__bar { margin-top: 6px; height: 2px; background: rgba(34,211,238,.1); overflow: hidden; }
    .member__bar span { display: block; height: 100%; background: var(--amber); box-shadow: 0 0 6px var(--amber); transition: width .6s ease; }

    /* PIS */
    .pis { display: flex; flex-direction: column; gap: 10px; }
    .pis__title { display: flex; gap: 10px; align-items: center; color: var(--cyan); }
    .pis__progress { display: flex; flex-direction: column; gap: 4px; }
    .pis__bar { height: 4px; background: rgba(34,211,238,.1); overflow: hidden; }
    .pis__bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--cyan), var(--amber)); box-shadow: 0 0 8px var(--cyan); transition: width .8s ease; }
    .pis__meta { font-size: 9px; letter-spacing: 1.5px; color: var(--text-dim); text-transform: uppercase; }
    .pis__area { display: grid; grid-template-columns: 110px 1fr 32px; gap: 10px; align-items: center; font-size: 10px; padding: 4px 0; }
    .pis__area-name { color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
    .pis__area-bar { height: 3px; background: rgba(34,211,238,.1); overflow: hidden; }
    .pis__area-bar span { display: block; height: 100%; background: var(--cyan-deep); box-shadow: 0 0 6px var(--cyan); transition: width .6s ease; }
    .pis__area-pct { text-align: right; font-size: 11px; }

    /* ROI radar */
    .roi-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center; }
    @media (max-width: 1400px) { .roi-wrap { grid-template-columns: 1fr; } }
    .radar { width: 100%; height: auto; max-height: 220px; }
    .radar__lbl {
      font-family: 'Orbitron', monospace;
      font-size: 7px;
      fill: var(--text-dim);
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .roi-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .roi-meta__cell {
      border: 1px solid var(--line);
      padding: 10px 8px;
      text-align: center;
      background: rgba(34,211,238,.03);
    }
    .roi-meta__num { font-size: 18px; }
    .roi-meta__lbl { font-size: 8px; color: var(--text-dim); margin-top: 2px; letter-spacing: 1.5px; }

    /* feed */
    .feed-body { max-height: 220px; overflow-y: auto; }
    .feed__row {
      display: grid;
      grid-template-columns: 10px 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 6px 4px;
      border-bottom: 1px dashed rgba(34,211,238,.08);
    }
    .feed__row:last-child { border-bottom: 0; }
    .feed__dot { width: 8px; height: 8px; border-radius: 50%; }
    .feed__name { font-size: 12px; font-weight: 600; color: var(--text); }
    .feed__meta { font-size: 9px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; }

    /* empty */
    .empty {
      font-family: 'Orbitron', monospace;
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--text-faint);
      text-align: center;
      padding: 14px 0;
    }

    /* ticker */
    .ticker {
      border-top: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
      background: rgba(0,0,0,.4);
      overflow: hidden;
      height: 22px;
      display: flex;
      align-items: center;
    }
    .ticker__track {
      display: flex;
      gap: 80px;
      white-space: nowrap;
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--cyan-soft);
      animation: ticker-roll 60s linear infinite;
    }
    @keyframes ticker-roll {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }

    /* FAB */
    .fab {
      position: fixed;
      right: 30px;
      bottom: 40px;
      display: flex; align-items: center; gap: 10px;
      padding: 12px 22px;
      background: linear-gradient(135deg, rgba(245,158,11,.18), rgba(245,158,11,.04));
      border: 1px solid var(--amber);
      color: var(--amber-soft);
      cursor: pointer;
      z-index: 70;
      box-shadow: var(--glow-amber);
      animation: glow-pulse-amber 3s ease-in-out infinite;
    }
    @keyframes glow-pulse-amber {
      0%, 100% { box-shadow: 0 0 12px rgba(245,158,11,.4), 0 0 32px rgba(245,158,11,.2); }
      50%      { box-shadow: 0 0 18px rgba(245,158,11,.7), 0 0 48px rgba(245,158,11,.3); }
    }
    .fab:hover { transform: translateY(-2px); background: linear-gradient(135deg, rgba(245,158,11,.3), rgba(245,158,11,.1)); }
    .fab__plus { font-size: 18px; font-weight: 700; }
    .fab__label { font-size: 11px; }
    .fab.arc-frame::before, .fab.arc-frame::after { border-color: var(--amber); }

    /* modal */
    .modal {
      position: fixed; inset: 0;
      background: rgba(3, 6, 14, .85);
      backdrop-filter: blur(8px);
      display: grid; place-items: center;
      z-index: 200;
      animation: iris-in .25s ease;
    }
    @keyframes iris-in {
      from { opacity: 0; backdrop-filter: blur(0); }
      to   { opacity: 1; }
    }
    .modal__box {
      background: var(--panel-solid);
      border: 1px solid var(--line-strong);
      padding: 26px;
      width: min(460px, 92vw);
      display: flex; flex-direction: column; gap: 14px;
      box-shadow: var(--glow-cyan);
      animation: box-in .35s cubic-bezier(.2,.7,.2,1);
    }
    @keyframes box-in {
      from { opacity: 0; transform: translateY(20px) scale(.96); }
      to   { opacity: 1; transform: translateY(0)    scale(1); }
    }
    .modal__title { margin: 0 0 4px; font-size: 14px; color: var(--cyan); }
    .modal__row { display: flex; gap: 10px; }
    .modal__row .cmd-field { flex: 1; }
    .modal__row--end { justify-content: flex-end; }

    /* toast */
    .toast {
      position: fixed;
      bottom: 110px; right: 30px;
      padding: 10px 18px;
      background: var(--panel-solid);
      border: 1px solid var(--cyan);
      color: var(--cyan);
      display: flex; gap: 10px; align-items: center;
      z-index: 250;
      box-shadow: var(--glow-cyan);
      animation: toast-in .3s ease;
    }
    .toast__dot { width: 8px; height: 8px; background: var(--cyan); box-shadow: var(--glow-cyan); animation: pulse-soft 1s infinite; }
    @keyframes toast-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
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

  gauges = computed(() => {
    const m = this.svc.sprintMetrics();
    const wk = this.svc.weeklyInvocations();
    return [
      { label: 'WEEKLY OPS', value: wk,                              unit: 'RUNS',  sub: 'LAST 7D',    pct: Math.min(100, wk * 10),                       color: '#22d3ee' },
      { label: 'TIME SAVED', value: this.svc.totalTimeSavedHours(),  unit: 'HOURS', sub: 'ALL TIME',   pct: Math.min(100, this.svc.totalTimeSavedHours()),color: '#22d3ee' },
      { label: 'PREVENTED',  value: this.svc.totalPrevented(),       unit: 'FINDINGS', sub: 'ACTIONED',pct: Math.min(100, this.svc.totalPrevented() * 5), color: '#f59e0b' },
      { label: 'ADOPTION',   value: this.svc.adoptionRate(),         unit: '%',     sub: `${this.svc.activeUsers()}/${this.svc.teamSize()} ACTIVE`, pct: this.svc.adoptionRate(),  color: '#34d399' },
      { label: 'TOTAL OPS',  value: this.svc.totalInvocations(),     unit: 'RUNS',  sub: 'CUMULATIVE', pct: Math.min(100, this.svc.totalInvocations() * 2), color: '#67e8f9' }
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
          accent: g?.accent ?? '#22d3ee',
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

  tickerText = computed(() => {
    const m = this.svc.sprintMetrics();
    const wk = this.svc.weeklyInvocations();
    if (this.svc.totalInvocations() === 0) {
      return 'ARC-OS ONLINE · AWAITING TELEMETRY · LOG YOUR FIRST OPERATION VIA THE LOG OP CONSOLE';
    }
    return `SPRINT ${this.svc.currentSprint()} · ${m.runs} OPS · ${m.timeSavedHours}H SAVED · ${m.prevented} PREVENTED · ${wk} OPS THIS WEEK · ${this.svc.adoptionRate()}% SQUAD ADOPTION`;
  });

  // --- radar geometry ---
  private get radarAxes() {
    const m = this.svc.sprintMetrics();
    const all = this.svc;
    return [
      { label: 'OPS',       value: Math.min(1, m.runs / 30) },
      { label: 'TIME',      value: Math.min(1, m.timeSavedHours / 40) },
      { label: 'PREVENTED', value: Math.min(1, m.prevented / 25) },
      { label: 'ACT RATE',  value: m.actionRate / 100 },
      { label: 'SQUAD',     value: all.adoptionRate() / 100 },
      { label: 'BREADTH',   value: Math.min(1, all.teamStats().reduce((s, t) => s + t.uniqueAgents, 0) / 40) }
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
    const cx = 120, cy = 100, r = 88;
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
      this.flash(`OPERATION LOGGED · ${entry.agentName.toUpperCase()}`);
      this.form = { agentId: '', outcome: 'success', findingCount: 3, actioned: 2, dismissed: 1 };
      this.logOpen.set(false);
    }
  }

  submitPis(): void {
    this.svc.updatePisState(this.pisDraft);
    this.flash('PIS SYNCHRONISED');
    this.pisOpen.set(false);
  }

  relTime(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'JUST NOW';
    if (m < 60) return `T-${m}M`;
    const h = Math.floor(m / 60);
    if (h < 24) return `T-${h}H`;
    return `T-${Math.floor(h / 24)}D`;
  }

  private flash(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2200);
  }
}
