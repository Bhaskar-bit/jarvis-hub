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
      <h2 class="grp__name">{{ group.name }}</h2>
      <span class="grp__divider"></span>
      <span class="grp__count">{{ agents.length }} agent{{ agents.length === 1 ? '' : 's' }}</span>
    </header>
    <div class="grp__grid">
      <app-agent-card *ngFor="let a of agents" [agent]="a" [group]="group"></app-agent-card>
    </div>
  </section>
  `,
  styles: [`
    .grp { margin: 28px 0; padding: 0 20px; }
    .grp__head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .grp__bar { width: 4px; height: 22px; border-radius: 2px; }
    .grp__name { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); }
    .grp__divider { flex: 1; height: 1px; background: var(--border); }
    .grp__count { font-size: 12px; color: var(--text-muted); }
    .grp__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 14px; }
  `]
})
export class AgentGroupComponent {
  @Input({ required: true }) group!: AgentGroup;
  @Input({ required: true }) agents: Agent[] = [];
}
