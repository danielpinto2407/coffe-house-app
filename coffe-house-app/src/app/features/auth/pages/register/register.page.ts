import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+57)?[3][0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );

  readonly errorMsg = signal<string | null>(null);
  readonly loading = signal(false);
  readonly success = signal(false);

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
      await this.auth.signUp(
        this.form.controls.email.value,
        this.form.controls.password.value,
        this.form.controls.fullName.value,
        this.form.controls.phone.value,
      );
      this.success.set(true);
      setTimeout(() => this.router.navigate(['/auth/login']), 3000);
    } catch (err) {
      this.errorMsg.set(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      this.loading.set(false);
    }
  }
}
