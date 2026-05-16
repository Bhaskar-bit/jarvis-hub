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
  <div class="dash">
    <!-- Command bar -->
    <div class="cmdbar">
      <label>Sprint
        <select [ngModel]="svc.currentSprint()"
                (ngModelChange)="svc.currentSprint.set($event); svc.persist()"
                data-testid="sprint-select">
          <option *ngFor="let s of sprints">{{ s }}</option>
        </select>
      </label>
      <label>You are
        <select [ngModel]="svc.currentUser()"
                (ngModelChange)="svc.currentUser.set($event); svc.persist()">
          <option *ngFor="let u of users">{{ u }}</option>
        </select>
      </label>
      <label>Team size
        <input type="number" min="1" max="100"
               [ngModel]="svc.teamSize()"
               (ngModelChange)="svc.teamSize.set(+$event); svc.persist()" />
      </label>
      <button class="btn btn--ghost" (click)="pisOpen.set(true)" data-testid="pis-btn">🧠 Update PIS</button>
    </div>

    <!-- Hero metrics -->
    <div class="hero">
      <div class="hero__card">
        <div class="hero__label">This Week</div>
        <div class="hero__num">{{ svc.weeklyInvocations() }}</div>
        <div class="hero__sub">invocations</div>
      </div>
      <div class="hero__card">
        <div class="hero__label">Time Saved</div>
        <div class="hero__num">{{ svc.totalTimeSavedHours() }}</div>
        <div class="hero__sub">hours total</div>
      </div>
      <div class="hero__card">
        <div class="hero__label">Issues Prevented</div>
        <div class="hero__num">{{ svc.totalPrevented() }}</div>
        <div class="hero__sub">actioned findings</div>
      </div>
      <div class="hero__card">
        <div class="hero__label">Team Adoption</div>
        <div class="hero__num">{{ svc.adoptionRate() }}<span class="hero__pct">%</span></div>
        <div class="hero__sub">{{ svc.activeUsers() }} / {{ svc.teamSize() }} active 7d</div>
      </div>
      <div class="hero__card">
        <div class="hero__label">Total Invocations</div>
        <div class="hero__num">{{ svc.totalInvocations() }}</div>
        <div class="hero__sub">all time</div>
      </div>
    </div>

    <!-- 3-col grid -->
    <div class="grid">
      <!-- Col 1 — rankings -->
      <section class="panel">
        <h3 class="panel__title">🏆 Agent Rankings</h3>
        <div class="rank" *ngFor="let r of rankings(); let i = index">
          <span class="rank__pos">{{ i + 1 }}</span>
          <div class="rank__body">
            <div class="rank__name">{{ r.name }}</div>
            <div class="rank__meta">
              <span class="dom-dot" [style.background]="r.accent"></span>
              {{ r.domain }}
            </div>
            <div class="rank__bar"><span [style.width.%]="r.healthPct" [style.background]="r.accent"></span></div>
          </div>
          <div class="rank__chips">
            <span class="chip">▶ {{ r.runs }}</span>
            <span class="chip">⏱ {{ r.timeHr }}h</span>
            <span class="chip chip--score">{{ r.healthPct }}</span>
          </div>
        </div>
        <p *ngIf="rankings().length === 0" class="empty">No invocations yet — click <strong>+ Log Usage</strong>.</p>
      </section>

      <!-- Col 2 — team + PIS -->
      <section class="panel">
        <h3 class="panel__title">👥 Team Adoption</h3>
        <div class="member" *ngFor="let m of svc.teamStats()">
          <div class="member__name">{{ m.user }}</div>
          <div class="member__meta">
            <span class="chip">▶ {{ m.runs }}</span>
            <span class="chip">⚙ {{ m.uniqueAgents }} agents</span>
            <span class="chip">⏱ {{ (m.timeSavedMin / 60).toFixed(1) }}h</span>
          </div>
          <div class="member__bar"><span [style.width.%]="m.breadth"></span></div>
        </div>
        <p *ngIf="svc.teamStats().length === 0" class="empty">No team activity yet.</p>

        <h3 class="panel__title panel__title--mt">🧠 PIS State</h3>
        <div class="pis">
          <div class="pis__row">
            <strong>{{ svc.pisState().projectName }}</strong>
            <span class="chip">{{ svc.pisState().version }}</span>
          </div>
          <div class="pis__bar">
            <span [style.width.%]="svc.pisState().progressToV1"></span>
          </div>
          <div class="pis__meta">
            {{ svc.pisState().progressToV1 }}% to v1.0 ·
            {{ svc.pisState().sessionsLogged }} sessions
          </div>
          <div class="pis__area" *ngFor="let a of svc.pisState().areas">
            <span class="pis__area-name">{{ a.name }}</span>
            <div class="pis__area-bar"><span [style.width.%]="a.maturity"></span></div>
            <span class="pis__area-pct">{{ a.maturity }}%</span>
          </div>
        </div>
      </section>

      <!-- Col 3 — ROI + feed -->
      <section class="panel">
        <h3 class="panel__title">💰 Sprint ROI — {{ svc.currentSprint() }}</h3>
        <div class="roi">
          <div class="roi__cell">
            <div class="roi__num">{{ svc.sprintMetrics().timeSavedHours }}h</div>
            <div class="roi__lbl">time saved</div>
          </div>
          <div class="roi__cell">
            <div class="roi__num">{{ svc.sprintMetrics().prevented }}</div>
            <div class="roi__lbl">issues prevented</div>
          </div>
          <div class="roi__cell">
            <div class="roi__num">{{ svc.sprintMetrics().actionRate }}%</div>
            <div class="roi__lbl">action rate</div>
          </div>
          <div class="roi__cell roi__cell--full">
            <div class="roi__lbl">Cumulative (all time)</div>
            <div class="roi__sub">
              {{ svc.totalInvocations() }} runs · {{ svc.totalTimeSavedHours() }}h saved ·
              {{ svc.totalPrevented() }} prevented
            </div>
          </div>
        </div>

        <h3 class="panel__title panel__title--mt">📡 Live Feed</h3>
        <div class="feed" *ngFor="let l of recentFeed()">
          <span class="dom-dot" [style.background]="l.accent"></span>
          <div class="feed__body">
            <div class="feed__name">{{ l.agentName }}</div>
            <div class="feed__meta">
              {{ l.user }} · {{ relTime(l.timestamp) }}
            </div>
          </div>
          <span class="chip chip--mini">{{ l.outcome }}</span>
          <span class="chip chip--mini">{{ l.actioned }}/{{ l.findingCount }}</span>
        </div>
        <p *ngIf="recentFeed().length === 0" class="empty">No activity yet.</p>
      </section>
    </div>

    <!-- FAB -->
    <button class="fab" (click)="logOpen.set(true)" data-testid="fab-log">+ Log Usage</button>

    <!-- Log modal -->
    <div class="modal" *ngIf="logOpen()" (click)="logOpen.set(false)">
      <div class="modal__box" (click)="$event.stopPropagation()">
        <h3>Log Invocation</h3>
        <label>Agent
          <select [(ngModel)]="form.agentId">
            <option value="" disabled>Select…</option>
            <option *ngFor="let a of svc.agents()" [value]="a.id">{{ a.name }}</option>
          </select>
        </label>
        <label>Outcome
          <select [(ngModel)]="form.outcome">
            <option value="success">Success — found & actionable</option>
            <option value="partial">Partial — some value</option>
            <option value="noissue">No issue — clean</option>
            <option value="failed">Failed — no value</option>
          </select>
        </label>
        <div class="row">
          <label>Findings <input type="number" min="0" [(ngModel)]="form.findingCount"/></label>
          <label>Actioned <input type="number" min="0" [(ngModel)]="form.actioned"/></label>
          <label>Dismissed <input type="number" min="0" [(ngModel)]="form.dismissed"/></label>
        </div>
        <div class="row row--end">
          <button class="btn btn--ghost" (click)="logOpen.set(false)">Cancel</button>
          <button class="btn btn--primary" (click)="submitLog()" [disabled]="!form.agentId" data-testid="submit-log">
            Log Invocation
          </button>
        </div>
      </div>
    </div>

    <!-- PIS modal -->
    <div class="modal" *ngIf="pisOpen()" (click)="pisOpen.set(false)">
      <div class="modal__box" (click)="$event.stopPropagation()">
        <h3>Update PIS</h3>
        <label>Project name <input [(ngModel)]="pisDraft.projectName" /></label>
        <label>Version <input [(ngModel)]="pisDraft.version" /></label>
        <label>Sessions logged <input type="number" min="0" [(ngModel)]="pisDraft.sessionsLogged" /></label>
        <label>Progress to v1.0 (%) <input type="number" min="0" max="100" [(ngModel)]="pisDraft.progressToV1" /></label>
        <div class="row row--end">
          <button class="btn btn--ghost" (click)="pisOpen.set(false)">Cancel</button>
          <button class="btn btn--primary" (click)="submitPis()">Save</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast" *ngIf="toast()">{{ toast() }}</div>
  </div>
  `,
  styles: [`
    .dash { padding: 16px 20px 80px; display: flex; flex-direction: column; gap: 16px; }
    .cmdbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; }
    .cmdbar label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .cmdbar select, .cmdbar input { padding: 6px 10px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-family: inherit; min-width: 120px; }
    .hero { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
    .hero__card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; box-shadow: var(--shadow); }
    .hero__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700; }
    .hero__num { font-size: 30px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: var(--text); line-height: 1.1; margin-top: 4px; }
    .hero__pct { font-size: 18px; color: var(--text-muted); }
    .hero__sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } .hero { grid-template-columns: repeat(2, 1fr); } }
    .panel { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 10px; }
    .panel__title { margin: 0; font-size: 13px; font-weight: 700; color: var(--text); }
    .panel__title--mt { margin-top: 8px; padding-top: 10px; border-top: 1px dashed var(--border); }
    .rank { display: grid; grid-template-columns: 24px 1fr auto; gap: 10px; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); }
    .rank:last-child { border-bottom: 0; }
    .rank__pos { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 13px; color: var(--text-muted); text-align: center; }
    .rank__name { font-weight: 600; font-size: 13px; color: var(--text); }
    .rank__meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); }
    .dom-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .rank__bar { margin-top: 4px; background: var(--input-bg); height: 4px; border-radius: 2px; overflow: hidden; }
    .rank__bar span { display: block; height: 100%; }
    .rank__chips { display: flex; flex-direction: column; gap: 2px; align-items: end; }
    .chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; background: var(--input-bg); border-radius: 999px; font-size: 10px; color: var(--text-muted); font-weight: 600; }
    .chip--mini { font-size: 9px; padding: 1px 5px; }
    .chip--score { background: var(--text); color: var(--card-bg); }
    .empty { font-size: 12px; color: var(--text-faint); margin: 8px 0; }
    .member { display: grid; grid-template-columns: 1fr auto; gap: 6px 10px; padding: 6px 0; border-bottom: 1px solid var(--border); }
    .member:last-child { border-bottom: 0; }
    .member__name { font-weight: 600; font-size: 13px; color: var(--text); }
    .member__meta { display: flex; gap: 4px; }
    .member__bar { grid-column: 1 / -1; background: var(--input-bg); height: 3px; border-radius: 2px; overflow: hidden; }
    .member__bar span { display: block; height: 100%; background: var(--amber); }
    .pis { display: flex; flex-direction: column; gap: 6px; }
    .pis__row { display: flex; align-items: center; gap: 8px; }
    .pis__bar { background: var(--input-bg); height: 6px; border-radius: 3px; overflow: hidden; }
    .pis__bar span { display: block; height: 100%; background: var(--amber); }
    .pis__meta { font-size: 11px; color: var(--text-muted); }
    .pis__area { display: grid; grid-template-columns: 90px 1fr 36px; gap: 8px; align-items: center; font-size: 11px; color: var(--text-muted); }
    .pis__area-bar { background: var(--input-bg); height: 4px; border-radius: 2px; overflow: hidden; }
    .pis__area-bar span { display: block; height: 100%; background: #6d28d9; }
    .pis__area-pct { font-family: 'JetBrains Mono', monospace; text-align: right; }
    .roi { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .roi__cell { background: var(--input-bg); padding: 10px; border-radius: 8px; text-align: center; }
    .roi__cell--full { grid-column: 1 / -1; text-align: left; }
    .roi__num { font-size: 20px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: var(--text); }
    .roi__lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600; }
    .roi__sub { font-size: 12px; color: var(--text); margin-top: 2px; }
    .feed { display: grid; grid-template-columns: 12px 1fr auto auto; gap: 8px; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); }
    .feed:last-child { border-bottom: 0; }
    .feed__name { font-size: 12px; font-weight: 600; color: var(--text); }
    .feed__meta { font-size: 10px; color: var(--text-muted); }
    .fab { position: fixed; right: 24px; bottom: 24px; background: var(--amber); color: #fff; border: 0; padding: 14px 22px; border-radius: 999px; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,.2); z-index: 60; }
    .fab:hover { transform: translateY(-1px); }
    .modal { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: grid; place-items: center; z-index: 100; }
    .modal__box { background: var(--card-bg); padding: 22px; border-radius: 12px; width: min(440px, 92vw); display: flex; flex-direction: column; gap: 12px; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
    .modal__box h3 { margin: 0; }
    .modal__box label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .modal__box input, .modal__box select { padding: 8px 10px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-family: inherit; }
    .row { display: flex; gap: 8px; }
    .row label { flex: 1; }
    .row--end { justify-content: flex-end; }
    .btn { padding: 8px 14px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; }
    .btn--primary { background: var(--amber); border-color: var(--amber); color: #fff; }
    .btn--primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn--ghost { background: transparent; }
    .toast { position: fixed; bottom: 90px; right: 24px; background: var(--text); color: var(--card-bg); padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; z-index: 200; box-shadow: 0 8px 20px rgba(0,0,0,.3); }
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

  rankings = computed(() => {
    const metrics = this.svc.agentMetrics();
    return this.svc.agents()
      .map(a => {
        const m = metrics[a.id];
        const g = this.svc.getGroup(a.group);
        const healthPct = Math.min(100, m.runs * 8 + m.actionRate / 2);
        return {
          id: a.id,
          name: a.name,
          domain: a.group,
          accent: g?.accent ?? '#666',
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

  submitLog(): void {
    const entry = this.svc.logInvocation(this.form);
    if (entry) {
      this.flash(`Logged ${entry.agentName}`);
      this.form = { agentId: '', outcome: 'success', findingCount: 3, actioned: 2, dismissed: 1 };
      this.logOpen.set(false);
    }
  }

  submitPis(): void {
    this.svc.updatePisState(this.pisDraft);
    this.flash('PIS updated');
    this.pisOpen.set(false);
  }

  relTime(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  private flash(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 1800);
  }
}
