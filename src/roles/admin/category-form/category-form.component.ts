import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../models/model';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-category-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.css',
  standalone: true,
})
export class CategoryFormComponent implements OnInit {
  @Input() category: Category | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  formData = {
    name: '',
    description: '',
    isActive: true,
  };

  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastTimer: any;
  toastOffset = 72;

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    if (this.category) {
      this.formData = {
        name: this.category.name,
        description: this.category.description || '',
        isActive: this.category.isActive,
      };
    }
  }

  onSubmit(): void {
    if (!this.formData.name.trim()) {
      this.showToast('Category name is required', 'error');
      return;
    }

    if (!this.formData.description.trim()) {
      this.showToast('Description is required', 'error');
      return;
    }

    if (this.category) {
      // Update existing category
      this.categoryService
        .updateCategory(this.category.categoryID, this.formData)
        .subscribe({
          next: () => {
            this.saved.emit();
          },
          error: (error) => {
            console.error('Error updating category:', error);
            this.showToast('Failed to update category. Please try again.', 'error');
          },
        });
    } else {
      // Create new category
      this.categoryService.createCategory(this.formData).subscribe({
        next: () => {
          // alert('Category created successfully!');
          this.saved.emit();
        },
        error: (error) => {
          console.error('Error creating category:', error);
          const errorMsg =
            error.error?.message ||
            error.error ||
            error.message ||
            'Failed to create category. Please try again.';
          this.showToast(`Error: ${errorMsg}`, 'error');
        },
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private showToast(
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
  ): void {
    this.toastMessage = message;
    this.toastType = type;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 2600);
  }
}
