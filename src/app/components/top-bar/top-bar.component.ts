import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentsService } from '../../services/agents.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <header class="topbar">
    <div class="topbar__row">
      <div class="topbar__brand">
        <span class="live-dot" aria-hidden="true"></span>
        <span class="brand-name">JARVIS</span>
        <span class="brand-sub">Agent Command Centre</span>
      </div>

      <nav class="view-switcher" role="tablist">
        <button
          role="tab"
          class="view-tab"
          [class.view-tab--active]="svc.activeView() === 'agents'"
          (click)="svc.activeView.set('agents')"
          data-testid="view-agents">
          🤖 Agents
        </button>
        <button
          role="tab"
          class="view-tab"
          [class.view-tab--active]="svc.activeView() === 'jarvis'"
          (click)="svc.activeView.set('jarvis')"
          data-testid="view-jarvis">
          📊 Jarvis
        </button>
      </nav>

      <input
        *ngIf="svc.activeView() === 'agents'"
        type="search"
        class="search"
        placeholder="Search agents…"
        [ngModel]="svc.search()"
        (ngModelChange)="svc.search.set($event)"
        data-testid="search-input" />

      <div class="topbar__stats">
        <span class="stat-chip" data-testid="stat-agents">
          <strong>{{ svc.agents().length }}</strong> agents
        </span>
        <span class="stat-chip" data-testid="stat-loaded">
          <strong>{{ svc.loadedCount() }}</strong> loaded
        </span>
        <a class="icon-btn" href="https://github.com/bhaskar-sharma/agentic-universe"
           target="_blank" rel="noopener" title="GitHub">⎇</a>
        <button class="icon-btn" (click)="svc.loadAllFromGitHub()" title="Refresh"
                data-testid="refresh-btn">↺</button>
        <button *ngIf="svc.activeView() === 'jarvis'"
                class="icon-btn icon-btn--accent"
                (click)="svc.exportDigest()" title="Export digest"
                data-testid="export-btn">📤</button>
        <button class="icon-btn" (click)="svc.toggleTheme()" title="Theme"
                data-testid="theme-toggle">
          {{ svc.theme() === 'light' ? '🌙' : '☀️' }}
        </button>
      </div>
    </div>

    <div class="filter-row" *ngIf="svc.activeView() === 'agents'">
      <button class="pill"
              [class.pill--active]="svc.activeGroup() === 'all'"
              (click)="svc.activeGroup.set('all')">
        All
      </button>
      <button *ngFor="let g of svc.groups"
              class="pill"
              [class.pill--active]="svc.activeGroup() === g.name"
              [style.--pill-accent]="g.accent"
              (click)="svc.activeGroup.set(g.name)">
        {{ g.name }}
      </button>
    </div>
  </header>
  `,
  styles: [`
    .topbar { position: sticky; top: 0; z-index: 50; background: var(--card-bg); border-bottom: 1px solid var(--border); }
    .topbar__row { display: flex; align-items: center; gap: 16px; padding: 10px 20px; }
    .topbar__brand { display: flex; align-items: center; gap: 10px; font-weight: 800; }
    .live-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 1.6s infinite; }
    .brand-name { color: var(--amber); letter-spacing: 1px; }
    .brand-sub { font-size: 12px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .view-switcher { display: flex; gap: 4px; background: var(--input-bg); padding: 3px; border-radius: 8px; }
    .view-tab { background: none; border: 0; padding: 6px 14px; border-radius: 6px; font-weight: 600; color: var(--text-muted); cursor: pointer; font-size: 13px; }
    .view-tab--active { background: var(--card-bg); color: var(--text); box-shadow: var(--shadow); }
    .search { flex: 1; max-width: 280px; padding: 7px 12px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-family: inherit; }
    .topbar__stats { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .stat-chip { font-size: 12px; color: var(--text-muted); padding: 4px 8px; background: var(--input-bg); border-radius: 6px; }
    .stat-chip strong { color: var(--text); font-weight: 700; }
    .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; padding: 0; border: 1px solid var(--border); background: var(--card-bg); border-radius: 6px; color: var(--text); cursor: pointer; text-decoration: none; font-size: 14px; }
    .icon-btn:hover { background: var(--input-bg); }
    .icon-btn--accent { background: var(--amber); border-color: var(--amber); color: #fff; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 20px 12px; border-top: 1px solid var(--border); }
    .pill { --pill-accent: var(--text-muted); padding: 4px 10px; font-size: 12px; font-weight: 600; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-muted); border-radius: 999px; cursor: pointer; }
    .pill:hover { color: var(--text); }
    .pill--active { background: var(--pill-accent); border-color: var(--pill-accent); color: #fff; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  `]
})
export class TopBarComponent {
  svc = inject(AgentsService);
}
