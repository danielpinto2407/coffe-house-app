import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly auth = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private requiredRole: UserRole | null = null;
  private hasView = false;

  // ✅ effect() en el constructor — contexto de inyección válido
  constructor() {
    effect(() => {
      this.auth.currentUser(); // suscripción reactiva al signal
      this.updateView();
    });
  }

  @Input() set appHasRole(role: UserRole) {
    this.requiredRole = role;
    this.updateView();
  }

  private updateView(): void {
    const user = this.auth.currentUser();
    const hasAccess = user !== null && (
      this.requiredRole === null || user.role === this.requiredRole
    );

    if (hasAccess && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
