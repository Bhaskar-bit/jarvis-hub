import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentsService } from './services/agents.service';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { AgentGroupComponent } from './components/agent-group/agent-group.component';
import { JarvisDashboardComponent } from './components/jarvis-dashboard/jarvis-dashboard.component';
import { BootSequenceComponent } from './components/boot-sequence/boot-sequence.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TopBarComponent, AgentGroupComponent, JarvisDashboardComponent, BootSequenceComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  svc = inject(AgentsService);

  booted = signal(false);

  recentRuns = computed(() => {
    const map = new Map<string, number>();
    for (const r of this.svc.runs()) {
      map.set(r.agentId, Math.max(map.get(r.agentId) ?? 0, r.ts));
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, ts]) => {
        const a = this.svc.agents().find(x => x.id === id);
        return a ? { name: a.name, group: a.group, ts } : null;
      })
      .filter((x): x is { name: string; group: string; ts: number } => x !== null);
  });

  constructor() {
    if (sessionStorage.getItem('arc-booted') === '1') {
      this.booted.set(true);
    }
  }

  onBootDone(): void {
    this.booted.set(true);
    sessionStorage.setItem('arc-booted', '1');
  }
}
