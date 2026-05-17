import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Agent, AgentGroup } from '../../models/agent.model';
import { AgentCardComponent } from '../agent-card/agent-card.component';

@Component({
  selector: 'app-agent-group',
  standalone: true,
  imports: [CommonModule, AgentCardComponent],
  template: `
  <section class="grp" *ngIf="group">
    <header class="grp__head">
      <span class="grp__bar" [style.background]="group.accent" [style.box-shadow]="'0 0 10px ' + group.accent"></span>
      <h2 class="grp__name arc-title">{{ group.name.toUpperCase() }}</h2>
      <span class="grp__line"></span>
      <span class="grp__count arc-mono">{{ agents.length.toString().padStart(2, '0') }} MOD</span>
    </header>
    <div class="grp__grid arc-stagger">
      <app-agent-card *ngFor="let a of agents" [agent]="a" [group]="group"></app-agent-card>
    </div>
  </section>
  `,
  styles: [`
    .grp { margin: 28px 0; padding: 0 28px; position: relative; z-index: 1; }
    .grp__head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
    .grp__bar { width: 3px; height: 20px; }
    .grp__name { margin: 0; font-size: 13px; color: var(--cyan); letter-spacing: 4px; text-shadow: 0 0 8px rgba(34,211,238,.35); }
    .grp__line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--line), transparent); }
    .grp__count { font-size: 10px; color: var(--text-dim); letter-spacing: 2px; }
    .grp__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 14px; }
  `]
})
export class AgentGroupComponent {
  @Input({ required: true }) group!: AgentGroup;
  @Input({ required: true }) agents: Agent[] = [];
}
