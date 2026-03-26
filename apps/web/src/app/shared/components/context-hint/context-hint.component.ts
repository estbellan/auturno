import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { HintService } from '../../../core/hint.service';

@Component({
  selector: 'at-context-hint',
  standalone: true,
  templateUrl: './context-hint.component.html',
  styleUrl: './context-hint.component.scss',
})
export class ContextHintComponent implements OnInit {
  @Input({ required: true }) hintKey = '';
  @Input() icon = 'lightbulb';
  @Input() title = '';
  @Input({ required: true }) text = '';

  readonly visible = signal(false);

  private readonly hintService = inject(HintService);

  ngOnInit(): void {
    this.visible.set(!this.hintService.isDismissed(this.hintKey));
  }

  dismiss(): void {
    this.hintService.dismiss(this.hintKey);
    this.visible.set(false);
  }
}
