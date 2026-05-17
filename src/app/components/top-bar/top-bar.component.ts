import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentsService } from '../../services/agents.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <header class="hud">
    <div class="hud__inner">
      <!-- Brand / arc reactor -->
      <div class="hud__brand">
        <svg viewBox="0 0 40 40" class="mini-reactor" aria-hidden="true">
          <circle cx="20" cy="20" r="6"  fill="#22d3ee" opacity=".9"/>
          <circle cx="20" cy="20" r="10" fill="none" stroke="#22d3ee" stroke-width="0.6" stroke-dasharray="3 3" class="mini-r1"/>
          <circle cx="20" cy="20" r="15" fill="none" stroke="#22d3ee" stroke-width="0.4" opacity=".4"/>
        </svg>
        <div class="hud__brand-text">
          <div class="hud__brand-name arc-title">ARC-OS</div>
          <div class="hud__brand-sub arc-mono">JARVIS AGENT CONSOLE</div>
        </div>
        <span class="status-live">
          <span class="status-live__dot"></span>
          <span class="status-live__txt arc-mono">LIVE</span>
        </span>
      </div>

      <!-- View switcher -->
      <nav class="switch" role="tablist">
        <button
          role="tab"
          class="switch__tab"
          [class.switch__tab--active]="svc.activeView() === 'agents'"
          (click)="svc.activeView.set('agents')"
          data-testid="view-agents">
          <span class="switch__icon">◈</span>
          <span class="switch__lbl arc-title">AGENTS</span>
        </button>
        <button
          role="tab"
          class="switch__tab"
          [class.switch__tab--active]="svc.activeView() === 'jarvis'"
          (click)="svc.activeView.set('jarvis')"
          data-testid="view-jarvis">
          <span class="switch__icon">◉</span>
          <span class="switch__lbl arc-title">BRIDGE</span>
        </button>
      </nav>

      <!-- Search -->
      <div class="search-wrap" *ngIf="svc.activeView() === 'agents'">
        <span class="search-wrap__icon arc-data">⌕</span>
        <input
          type="search"
          class="arc-input search"
          placeholder="QUERY AGENTS…"
          [ngModel]="svc.search()"
          (ngModelChange)="svc.search.set($event)"
          data-testid="search-input" />
      </div>

      <!-- Telemetry & actions -->
      <div class="hud__meta">
        <span class="telem arc-mono">
          <span class="telem__lbl">AGENTS</span>
          <span class="telem__val">{{ svc.agents().length.toString().padStart(2, '0') }}</span>
        </span>
        <span class="telem arc-mono">
          <span class="telem__lbl">LOADED</span>
          <span class="telem__val">{{ svc.loadedCount().toString().padStart(2, '0') }}</span>
        </span>
        <button class="icon-btn" (click)="svc.loadAllFromGitHub()" title="Sync from GitHub"
                data-testid="refresh-btn">↻</button>
        <a class="icon-btn" href="https://github.com/bhaskar-sharma/agentic-universe"
           target="_blank" rel="noopener" title="Source">⎇</a>
      </div>
    </div>

    <!-- Group filter pills (agents view) -->
    <div class="pills" *ngIf="svc.activeView() === 'agents'">
      <button class="pill"
              [class.pill--active]="svc.activeGroup() === 'all'"
              (click)="svc.activeGroup.set('all')">
        <span class="pill__dot"></span>ALL
      </button>
      <button *ngFor="let g of svc.groups"
              class="pill"
              [class.pill--active]="svc.activeGroup() === g.name"
              [style.--pill-accent]="g.accent"
              (click)="svc.activeGroup.set(g.name)">
        <span class="pill__dot" [style.background]="g.accent"
              [style.box-shadow]="'0 0 6px ' + g.accent"></span>
        {{ g.name.toUpperCase() }}
      </button>
    </div>
  </header>
  `,
  styles: [`
    :host { position: sticky; top: 28px; z-index: 75; display: block; }
    .hud {
      background: linear-gradient(180deg, rgba(6,11,26,.92), rgba(6,11,26,.72));
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(10px);
      position: relative;
    }
    .hud::after {
      content: '';
      position: absolute;
      left: 0; right: 0; bottom: -1px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--cyan), transparent);
      opacity: .6;
    }
    .hud__inner {
      display: flex; align-items: center; gap: 18px;
      padding: 12px 28px;
    }

    /* brand */
    .hud__brand { display: flex; align-items: center; gap: 12px; }
    .mini-reactor { width: 36px; height: 36px; filter: drop-shadow(0 0 8px rgba(34,211,238,.65)); }
    .mini-r1 { transform-origin: center; animation: mini-spin 8s linear infinite; }
    @keyframes mini-spin { to { transform: rotate(360deg); } }
    .hud__brand-name { font-size: 16px; color: var(--cyan); letter-spacing: 4px; text-shadow: 0 0 10px rgba(34,211,238,.45); }
    .hud__brand-sub  { font-size: 8px; color: var(--text-dim); letter-spacing: 2px; text-transform: uppercase; }
    .status-live {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 2px 8px;
      border: 1px solid rgba(52,211,153,.4);
      background: rgba(52,211,153,.08);
      color: var(--green);
    }
    .status-live__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); animation: pulse-soft 1.4s infinite; }
    .status-live__txt { font-size: 9px; letter-spacing: 2px; }

    /* view switcher */
    .switch { display: flex; gap: 4px; padding: 3px; background: rgba(0,0,0,.4); border: 1px solid var(--line); }
    .switch__tab {
      background: transparent; border: 0; cursor: pointer;
      padding: 6px 18px;
      display: inline-flex; align-items: center; gap: 8px;
      color: var(--text-dim);
      transition: all .15s;
      position: relative;
    }
    .switch__icon { font-size: 14px; }
    .switch__lbl  { font-size: 10px; }
    .switch__tab:hover { color: var(--cyan-soft); }
    .switch__tab--active { color: var(--cyan); background: rgba(34,211,238,.1); box-shadow: inset 0 -2px 0 var(--cyan); text-shadow: 0 0 8px var(--cyan-soft); }

    /* search */
    .search-wrap { position: relative; flex: 1; max-width: 320px; }
    .search-wrap__icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; font-size: 14px; }
    .search { width: 100%; padding-left: 30px; text-transform: uppercase; letter-spacing: 1.5px; }

    /* telemetry & icons */
    .hud__meta { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .telem {
      display: inline-flex; flex-direction: column; align-items: center;
      padding: 4px 10px;
      border-left: 1px solid var(--line);
    }
    .telem__lbl { font-size: 8px; letter-spacing: 2px; color: var(--text-faint); text-transform: uppercase; }
    .telem__val { font-size: 14px; color: var(--cyan); font-weight: 700; }
    .icon-btn {
      width: 30px; height: 30px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid var(--line);
      background: rgba(0,0,0,.3);
      color: var(--cyan-soft);
      text-decoration: none;
      cursor: pointer;
      font-size: 14px;
      transition: all .15s;
    }
    .icon-btn:hover { border-color: var(--cyan); color: var(--cyan); box-shadow: var(--glow-soft); }

    /* pills */
    .pills {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding: 8px 28px 10px;
      border-top: 1px solid var(--line);
      background: rgba(0,0,0,.25);
    }
    .pill {
      --pill-accent: var(--cyan);
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 1.5px;
      color: var(--text-dim);
      background: transparent;
      border: 1px solid var(--line);
      cursor: pointer;
      transition: all .15s;
    }
    .pill__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-faint); }
    .pill:hover { color: var(--text); border-color: var(--line-strong); }
    .pill--active {
      color: var(--bg-deep);
      background: var(--pill-accent);
      border-color: var(--pill-accent);
      box-shadow: 0 0 12px var(--pill-accent);
    }
    .pill--active .pill__dot { background: var(--bg-deep) !important; box-shadow: none !important; }

    @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
  `]
})
export class TopBarComponent {
  svc = inject(AgentsService);
}
