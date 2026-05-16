import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly term$ = new Subject<string>();

  emit(term: string): void {
    this.term$.next(term);
  }
}
