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
          <radialGradient id="rg-l" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#fff" stop-opacity="1"/>
            <stop offset="60%"  stop-color="#14b8a6" stop-opacity=".55"/>
            <stop offset="100%" stop-color="#0f766e" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="18" fill="url(#rg-l)" class="reactor__core"/>
        <circle cx="100" cy="100" r="44" fill="none" stroke="#0f766e" stroke-width="0.6"
                stroke-dasharray="180 360"
                stroke-dashoffset="270"
                class="reactor__r1"/>
        <circle cx="100" cy="100" r="68" fill="none" stroke="#b45309" stroke-width="0.5"
                opacity=".55"
                stroke-dasharray="40 320"
                class="reactor__r2"/>
        <circle cx="100" cy="100" r="92" fill="none" stroke="#0f766e" stroke-width="0.3" opacity=".18"/>
      </svg>

      <div class="boot__name">
        <span class="arc-title boot__brand">ARC-OS</span>
        <span class="boot__sep"></span>
        <span class="arc-mono boot__sub">JARVIS AGENT CONSOLE</span>
      </div>

      <div class="boot__status arc-mono">
        <span>{{ statusLine() }}</span>
      </div>

      <div class="boot__bar"><span [style.width.%]="progress()"></span></div>

      <div class="boot__hint arc-mono">CLICK ANYWHERE TO SKIP</div>
    </div>
  </div>
  `,
  styles: [`
    .boot {
      position: fixed;
      inset: 0;
      background: #0a1020;
      display: grid;
      place-items: center;
      z-index: 9999;
      cursor: pointer;
      transition: opacity .9s ease;
    }
    .boot::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at center, rgba(45,212,191,.08), transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(217,119,6,.05), transparent 50%);
    }
    .boot--exit { opacity: 0; pointer-events: none; }

    .boot__core {
      display: flex; flex-direction: column; align-items: center; gap: 22px;
      animation: rise .8s cubic-bezier(.16,.84,.44,1);
    }
    @keyframes rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; } }

    .reactor { width: 200px; height: 200px; }
    .reactor__core { animation: core-glow 3.5s ease-in-out infinite; transform-origin: center; }
    .reactor__r1   { transform-origin: center; animation: spin 14s linear infinite; }
    .reactor__r2   { transform-origin: center; animation: spin-rev 22s linear infinite; }
    @keyframes spin       { to { transform: rotate(360deg); } }
    @keyframes spin-rev   { to { transform: rotate(-360deg); } }
    @keyframes core-glow {
      0%, 100% { opacity: .85; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.04); }
    }

    .boot__name {
      display: flex; align-items: center; gap: 14px;
      color: #e6ebf4;
    }
    .boot__brand { font-size: 20px; letter-spacing: 8px; color: #fff; }
    .boot__sep   { width: 1px; height: 14px; background: rgba(230,235,244,.3); }
    .boot__sub   { font-size: 10px; letter-spacing: 2.5px; color: #98a4ba; }

    .boot__status {
      min-height: 16px;
      font-size: 10px;
      letter-spacing: 2.5px;
      color: #5eead4;
      text-transform: uppercase;
    }

    .boot__bar {
      width: 280px;
      height: 1px;
      background: rgba(230,235,244,.1);
      overflow: hidden;
    }
    .boot__bar span {
      display: block;
      height: 100%;
      background: #5eead4;
      transition: width .15s linear;
    }

    .boot__hint {
      font-size: 8px;
      letter-spacing: 3px;
      color: #5d6b85;
      margin-top: 8px;
      animation: fade-blink 2.4s ease-in-out infinite;
    }
    @keyframes fade-blink {
      0%, 100% { opacity: .4; }
      50%      { opacity: 1; }
    }
  `]
})
export class BootSequenceComponent implements OnInit {
  @Output() done = new EventEmitter<void>();

  exiting = signal(false);
  progress = signal(0);
  statusLine = signal('');

  private readonly steps = [
    { at: 0,    label: 'INITIALISING CORE' },
    { at: 0.30, label: 'LINKING AGENT MESH' },
    { at: 0.65, label: 'SYNCHRONISING TELEMETRY' },
    { at: 0.92, label: 'SYSTEMS ONLINE' }
  ];
  private timers: number[] = [];
  private finished = false;

  ngOnInit(): void {
    const TOTAL = 2200;
    const start = performance.now();

    this.statusLine.set(this.steps[0].label);

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / TOTAL);
      this.progress.set(p * 100);
      const cur = [...this.steps].reverse().find(s => p >= s.at);
      if (cur) this.statusLine.set(cur.label);
      if (p < 1 && !this.finished) requestAnimationFrame(tick);
      else if (!this.finished) this.timers.push(window.setTimeout(() => this.finish(), 350));
    };
    requestAnimationFrame(tick);
  }

  skip(): void { this.finish(); }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.timers.forEach(t => clearTimeout(t));
    this.exiting.set(true);
    setTimeout(() => this.done.emit(), 900);
  }
}
