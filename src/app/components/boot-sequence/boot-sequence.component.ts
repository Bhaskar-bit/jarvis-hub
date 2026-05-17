import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-boot-sequence',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="boot" [class.boot--exit]="exiting()" (click)="skip()" data-testid="boot-overlay">
    <div class="boot__core">
      <svg viewBox="0 0 200 200" class="reactor">
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#67e8f9" stop-opacity="1"/>
            <stop offset="50%"  stop-color="#22d3ee" stop-opacity=".6"/>
            <stop offset="100%" stop-color="#0891b2" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="22" fill="url(#rg)" class="reactor__core"/>
        <circle cx="100" cy="100" r="34" fill="none" stroke="#22d3ee" stroke-width="1" stroke-dasharray="3 5" class="reactor__r1"/>
        <circle cx="100" cy="100" r="52" fill="none" stroke="#22d3ee" stroke-width="1" stroke-dasharray="8 12" opacity=".7" class="reactor__r2"/>
        <circle cx="100" cy="100" r="72" fill="none" stroke="#22d3ee" stroke-width="0.5" stroke-dasharray="2 22" opacity=".5" class="reactor__r3"/>
        <circle cx="100" cy="100" r="90" fill="none" stroke="#22d3ee" stroke-width="0.5" opacity=".25"/>
        <g class="reactor__ticks">
          <line x1="100" y1="6"   x2="100" y2="16"  stroke="#22d3ee" stroke-width="1.5"/>
          <line x1="100" y1="184" x2="100" y2="194" stroke="#22d3ee" stroke-width="1.5"/>
          <line x1="6"   y1="100" x2="16"  y2="100" stroke="#22d3ee" stroke-width="1.5"/>
          <line x1="184" y1="100" x2="194" y2="100" stroke="#22d3ee" stroke-width="1.5"/>
        </g>
      </svg>

      <div class="boot__text arc-title">
        <span class="boot__line" *ngFor="let l of visibleLines(); let i = index">
          <span class="boot__cursor" *ngIf="i === visibleLines().length - 1">›</span>
          {{ l }}
        </span>
      </div>

      <div class="boot__bar">
        <span [style.width.%]="progress()"></span>
      </div>
      <div class="boot__hint">CLICK TO SKIP</div>
    </div>
  </div>
  `,
  styles: [`
    .boot {
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse at center, rgba(34,211,238,.08), transparent 60%),
        #03060e;
      display: grid;
      place-items: center;
      z-index: 9999;
      cursor: pointer;
      transition: opacity .5s ease, transform .5s ease;
    }
    .boot--exit { opacity: 0; transform: scale(1.04); pointer-events: none; }
    .boot__core { display: flex; flex-direction: column; align-items: center; gap: 18px; }
    .reactor { width: 220px; height: 220px; filter: drop-shadow(0 0 18px rgba(34,211,238,.55)); }
    .reactor__core { animation: core-pulse 1.4s ease-in-out infinite; transform-origin: center; }
    .reactor__r1 { transform-origin: center; animation: spin 6s linear infinite; }
    .reactor__r2 { transform-origin: center; animation: spin-rev 12s linear infinite; }
    .reactor__r3 { transform-origin: center; animation: spin 24s linear infinite; }
    @keyframes spin       { to { transform: rotate(360deg); } }
    @keyframes spin-rev   { to { transform: rotate(-360deg); } }
    @keyframes core-pulse {
      0%, 100% { opacity: 1;  transform: scale(1); }
      50%      { opacity: .7; transform: scale(.92); }
    }
    .boot__text {
      font-family: 'Orbitron', monospace;
      font-size: 12px;
      letter-spacing: 3px;
      color: #67e8f9;
      text-align: center;
      text-shadow: 0 0 12px rgba(34,211,238,.55);
      min-height: 80px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .boot__line { display: block; opacity: 0; animation: line-in .25s ease forwards; }
    @keyframes line-in { to { opacity: 1; } }
    .boot__cursor { color: #f59e0b; margin-right: 4px; animation: blink 1s steps(1) infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    .boot__bar {
      width: 260px;
      height: 2px;
      background: rgba(34,211,238,.15);
      overflow: hidden;
    }
    .boot__bar span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #22d3ee, #f59e0b);
      box-shadow: 0 0 10px #22d3ee;
      transition: width .12s linear;
    }
    .boot__hint {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #4a6585;
      letter-spacing: 2px;
      margin-top: 4px;
    }
  `]
})
export class BootSequenceComponent implements OnInit {
  @Output() done = new EventEmitter<void>();

  exiting = signal(false);
  progress = signal(0);
  visibleLines = signal<string[]>([]);

  private readonly lines = [
    'INIT ARC-OS CORE',
    'LINKING AGENT MESH …',
    'SYSTEMS ONLINE'
  ];
  private timers: number[] = [];
  private finished = false;

  ngOnInit(): void {
    this.timers.push(window.setTimeout(() => this.visibleLines.set([this.lines[0]]), 120));
    this.timers.push(window.setTimeout(() => this.visibleLines.set(this.lines.slice(0, 2)), 520));
    this.timers.push(window.setTimeout(() => this.visibleLines.set(this.lines), 900));

    const start = performance.now();
    const total = 1250;
    const tick = (t: number) => {
      const p = Math.min(100, ((t - start) / total) * 100);
      this.progress.set(p);
      if (p < 100 && !this.finished) requestAnimationFrame(tick);
      else if (!this.finished) this.finish();
    };
    requestAnimationFrame(tick);
  }

  skip(): void { this.finish(); }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.timers.forEach(t => clearTimeout(t));
    this.exiting.set(true);
    setTimeout(() => this.done.emit(), 480);
  }
}
