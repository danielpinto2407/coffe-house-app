import { Component } from '@angular/core';
import { ProductModalService } from '../../core/services/product-modal.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-product-modal',
  templateUrl: './product-modal.component.html',
  imports: [CommonModule]
})
export class ProductModalComponent {
  constructor(public modal: ProductModalService) {}
}
