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
      <!-- Brand -->
      <div class="hud__brand">
        <svg viewBox="0 0 40 40" class="mini-reactor" aria-hidden="true">
          <circle cx="20" cy="20" r="5" fill="currentColor" opacity=".95"/>
          <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="0.5" stroke-dasharray="5 4" class="mini-r1"/>
          <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="0.4" opacity=".3"/>
        </svg>
        <div class="hud__brand-text">
          <div class="hud__brand-name arc-title">ARC-OS</div>
          <div class="hud__brand-sub arc-mono">Jarvis Agent Console</div>
        </div>
      </div>

      <!-- View switcher -->
      <nav class="switch" role="tablist">
        <button
          role="tab"
          class="switch__tab"
          [class.switch__tab--active]="svc.activeView() === 'agents'"
          (click)="svc.activeView.set('agents')"
          data-testid="view-agents">
          <span class="arc-title">Agents</span>
        </button>
        <button
          role="tab"
          class="switch__tab"
          [class.switch__tab--active]="svc.activeView() === 'jarvis'"
          (click)="svc.activeView.set('jarvis')"
          data-testid="view-jarvis">
          <span class="arc-title">Bridge</span>
        </button>
      </nav>

      <!-- Search -->
      <div class="search-wrap" *ngIf="svc.activeView() === 'agents'">
        <span class="search-wrap__icon">⌕</span>
        <input
          type="search"
          class="arc-input search"
          placeholder="Search agents…"
          [ngModel]="svc.search()"
          (ngModelChange)="svc.search.set($event)"
          data-testid="search-input" />
      </div>

      <!-- Telemetry & actions -->
      <div class="hud__meta">
        <span class="telem arc-mono">
          <span class="telem__lbl">Agents</span>
          <span class="telem__val">{{ svc.agents().length.toString().padStart(2, '0') }}</span>
        </span>
        <span class="telem arc-mono">
          <span class="telem__lbl">Loaded</span>
          <span class="telem__val">{{ svc.loadedCount().toString().padStart(2, '0') }}</span>
        </span>
        <button class="icon-btn" (click)="svc.loadAllFromGitHub()" title="Sync from GitHub"
                data-testid="refresh-btn">↻</button>
        <a class="icon-btn" href="https://github.com/bhaskar-sharma/agentic-universe"
           target="_blank" rel="noopener" title="Source">⎇</a>
        <button class="icon-btn icon-btn--theme" (click)="svc.toggleTheme()"
                [title]="svc.theme() === 'light' ? 'Switch to Eclipse (dark)' : 'Switch to Lumen (light)'"
                data-testid="theme-toggle">
          {{ svc.theme() === 'light' ? '◐' : '◑' }}
        </button>
      </div>
    </div>

    <!-- Group filter pills (agents view) -->
    <div class="pills" *ngIf="svc.activeView() === 'agents'">
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
        <span class="pill__dot" [style.background]="g.accent"></span>
        {{ g.name }}
      </button>
    </div>
  </header>
  `,
  styles: [`
    :host { position: sticky; top: 40px; z-index: 75; display: block; }
    .hud {
      background: var(--panel);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(14px);
      position: relative;
    }
    .hud__inner {
      display: flex; align-items: center; gap: 28px;
      padding: 16px 48px;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* brand */
    .hud__brand { display: flex; align-items: center; gap: 14px; color: var(--teal); }
    .mini-reactor { width: 30px; height: 30px; }
    .mini-r1 { transform-origin: center; animation: mini-spin 24s linear infinite; }
    @keyframes mini-spin { to { transform: rotate(360deg); } }
    .hud__brand-name {
      font-size: 14px;
      color: var(--text);
      letter-spacing: 5px;
    }
    .hud__brand-sub {
      font-size: 9px;
      color: var(--text-dim);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 2px;
    }

    /* view switcher */
    .switch {
      display: flex; gap: 2px;
      padding: 3px;
      background: var(--bg-elev-2);
      border: 1px solid var(--line);
      border-radius: 2px;
    }
    .switch__tab {
      background: transparent;
      border: 0;
      cursor: pointer;
      padding: 7px 20px;
      color: var(--text-dim);
      transition: all .25s ease;
      font-size: 10px;
      letter-spacing: 2px;
      border-radius: 2px;
    }
    .switch__tab:hover { color: var(--text); }
    .switch__tab--active {
      color: var(--text);
      background: var(--panel-solid);
      box-shadow: 0 1px 2px rgba(0,0,0,.04);
    }

    /* search */
    .search-wrap { position: relative; flex: 1; max-width: 320px; }
    .search-wrap__icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      pointer-events: none;
      font-size: 14px;
      color: var(--text-faint);
    }
    .search { width: 100%; padding-left: 32px; }

    /* telemetry & icons */
    .hud__meta { margin-left: auto; display: flex; align-items: center; gap: 14px; }
    .telem {
      display: inline-flex; flex-direction: column; align-items: end;
      padding: 0 8px 0 14px;
      border-left: 1px solid var(--line);
    }
    .telem__lbl {
      font-size: 8px;
      letter-spacing: 2px;
      color: var(--text-faint);
      text-transform: uppercase;
    }
    .telem__val {
      font-size: 14px;
      color: var(--text);
      font-weight: 600;
      margin-top: 2px;
    }
    .icon-btn {
      width: 32px; height: 32px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid var(--line);
      background: var(--panel-solid);
      color: var(--text-dim);
      text-decoration: none;
      cursor: pointer;
      font-size: 14px;
      border-radius: 2px;
      transition: all .25s ease;
    }
    .icon-btn:hover { border-color: var(--line-strong); color: var(--text); }
    .icon-btn--theme { font-size: 16px; }

    /* pills */
    .pills {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding: 10px 48px 14px;
      border-top: 1px solid var(--line);
      max-width: 1600px;
      margin: 0 auto;
    }
    .pill {
      --pill-accent: var(--teal);
      display: inline-flex; align-items: center; gap: 7px;
      padding: 6px 14px;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-dim);
      background: transparent;
      border: 1px solid var(--line);
      cursor: pointer;
      border-radius: 2px;
      transition: all .25s ease;
    }
    .pill__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-faint); }
    .pill:hover { color: var(--text); border-color: var(--line-strong); }
    .pill--active {
      color: var(--text);
      border-color: var(--pill-accent);
      background: var(--bg-elev);
    }
  `]
})
export class TopBarComponent {
  svc = inject(AgentsService);
}
