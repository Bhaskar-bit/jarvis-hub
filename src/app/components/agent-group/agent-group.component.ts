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
      <span class="grp__bar" [style.background]="group.accent"></span>
      <h2 class="grp__name arc-title">{{ group.name }}</h2>
      <span class="grp__line"></span>
      <span class="grp__count arc-mono">{{ agents.length.toString().padStart(2, '0') }} agents</span>
    </header>
    <div class="grp__grid arc-stagger">
      <app-agent-card *ngFor="let a of agents" [agent]="a" [group]="group"></app-agent-card>
    </div>
  </section>
  `,
  styles: [`
    .grp { margin: 44px 0; padding: 0 48px; position: relative; z-index: 1; max-width: 1600px; margin-left: auto; margin-right: auto; }
    .grp__head { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .grp__bar { width: 3px; height: 18px; }
    .grp__name { margin: 0; font-size: 13px; color: var(--text); letter-spacing: 4px; font-weight: 600; }
    .grp__line { flex: 1; height: 1px; background: var(--line); }
    .grp__count { font-size: 10px; color: var(--text-dim); letter-spacing: 1.5px; text-transform: uppercase; }
    .grp__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
  `]
})
export class AgentGroupComponent {
  @Input({ required: true }) group!: AgentGroup;
  @Input({ required: true }) agents: Agent[] = [];
}
