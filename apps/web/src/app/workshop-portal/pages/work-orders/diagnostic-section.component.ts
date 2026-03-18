import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DiagnosticViewModel } from '../../../core/api.service';

@Component({
  selector: 'at-diagnostic-section',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card detail-card">
      <div class="header-row section-header">
        <h3>Diagnostic</h3>
        @if (actions.length) {
          <div class="action-grid compact">
            @for (action of actions; track action.id) {
              <button type="button" [disabled]="actionLoading === action.id" (click)="actionSelected.emit(action.id)">
                {{ actionLoading === action.id ? 'Working...' : action.label }}
              </button>
            }
          </div>
        }
      </div>

      @if (diagnostic) {
        <dl class="detail-grid">
          <div><dt>Status</dt><dd>{{ formatStatus(diagnostic.status) }}</dd></div>
          <div><dt>Estimated operation hours</dt><dd>{{ diagnostic.estimatedOperationHours ?? 'Not set' }}</dd></div>
        </dl>

        <div class="stack-block">
          <dt>Summary</dt>
          <dd>{{ diagnostic.summary }}</dd>
        </div>

        <div class="stack-block">
          <dt>Notes</dt>
          <dd>{{ diagnostic.notes || 'No notes recorded.' }}</dd>
        </div>

        <div class="stack-block">
          <dt>Recommended services</dt>
          <div class="pill-list">
            @if (diagnostic.recommendedServices.length) {
              @for (service of diagnostic.recommendedServices; track service) {
                <span class="service-pill">{{ service }}</span>
              }
            } @else {
              <span class="empty-copy">No recommended services recorded yet.</span>
            }
          </div>
        </div>
      } @else {
        <p class="empty-copy">No diagnostic record is available for this work order yet.</p>

        <form class="editor-form" (ngSubmit)="createDraft.emit()">
          <label class="field">
            <span>Summary</span>
            <textarea name="summary" [(ngModel)]="form.summary" rows="3" required></textarea>
          </label>

          <label class="field">
            <span>Notes</span>
            <textarea name="notes" [(ngModel)]="form.notes" rows="3"></textarea>
          </label>

          <label class="field">
            <span>Estimated operation hours</span>
            <input type="number" name="estimatedOperationHours" [(ngModel)]="form.estimatedOperationHours" min="0" step="0.1" />
          </label>

          <div class="stack-block">
            <div class="inline-header">
              <dt>Recommended services</dt>
              <button type="button" class="secondary" (click)="addRecommendedService.emit()">Add service</button>
            </div>

            <div class="editor-list">
              @for (service of form.recommendedServices; track $index; let index = $index) {
                <div class="editor-row">
                  <input type="text" [name]="'recommendedService' + index" [(ngModel)]="form.recommendedServices[index]" />
                  <button
                    type="button"
                    class="secondary"
                    (click)="removeRecommendedService.emit(index)"
                    [disabled]="form.recommendedServices.length === 1"
                  >
                    Remove
                  </button>
                </div>
              }
            </div>
          </div>

          <button type="submit" [disabled]="actionLoading === 'create-diagnostic' || !canCreateDiagnostic">
            {{ actionLoading === 'create-diagnostic' ? 'Working...' : 'Create diagnostic draft' }}
          </button>
        </form>
      }
    </section>
  `,
  styles: [
    `
      .card { border-radius: 16px; background: #fff; border: 1px solid #dbe4f0; box-shadow: 0 10px 30px rgba(15,23,42,.06); }
      .detail-card { padding: 1rem; }
      .header-row, .inline-header { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; flex-wrap: wrap; }
      .section-header { margin-bottom: .75rem; }
      h3, dt, dd, p { margin: 0; }
      .detail-grid, .action-grid, .editor-form, .editor-list { display: grid; gap: .8rem; }
      .detail-grid, .action-grid { grid-template-columns: 1fr; }
      .action-grid.compact { width: 100%; }
      dt { color: #64748b; font-size: .8rem; font-weight: 600; margin-bottom: .2rem; }
      dd { color: #0f172a; font-weight: 600; }
      .field { display: grid; gap: .4rem; }
      .field span { color: #334155; font-size: .85rem; font-weight: 600; }
      input, textarea, button { font: inherit; }
      input, textarea { width: 100%; padding: .8rem .9rem; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; color: #0f172a; }
      .editor-row { display: grid; grid-template-columns: 1fr auto; gap: .75rem; align-items: center; }
      .pill-list, .stack-block { margin-top: .75rem; }
      .pill-list { display: flex; flex-wrap: wrap; gap: .5rem; }
      .service-pill { display: inline-flex; align-items: center; padding: .35rem .65rem; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: .8rem; font-weight: 600; }
      .empty-copy { color: #64748b; margin-top: .75rem; }
      .secondary { background: #334155; }
      button[disabled] { opacity: .7; }
      @media (min-width: 768px) {
        .detail-grid, .action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .action-grid.compact { width: auto; grid-template-columns: repeat(2, minmax(0, max-content)); }
      }
    `,
  ],
})
export class DiagnosticSectionComponent {
  @Input({ required: true }) diagnostic!: DiagnosticViewModel | null;
  @Input({ required: true }) actions!: Array<{ id: string; label: string }>;
  @Input({ required: true }) actionLoading!: string;
  @Input({ required: true }) form!: {
    summary: string;
    notes: string;
    estimatedOperationHours: number | null;
    recommendedServices: string[];
  };
  @Input({ required: true }) canCreateDiagnostic!: boolean;
  @Output() readonly actionSelected = new EventEmitter<string>();
  @Output() readonly createDraft = new EventEmitter<void>();
  @Output() readonly addRecommendedService = new EventEmitter<void>();
  @Output() readonly removeRecommendedService = new EventEmitter<number>();

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }
}
