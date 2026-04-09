import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  effect,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly errorMsg = signal<string | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    // ✅ Si ya está logueado, redirigir automáticamente a /menu
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/menu']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.loading()) return;

    this.errorMsg.set(null);
    this.loading.set(true);

    try {
      await this.auth.signIn(
        this.form.controls.email.value,
        this.form.controls.password.value,
      );
      await this.router.navigate(['/menu']);
    } catch (err) {
      this.errorMsg.set(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      this.loading.set(false);
    }
  }
}
