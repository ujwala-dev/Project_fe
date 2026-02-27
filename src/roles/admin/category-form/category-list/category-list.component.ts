import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CategoryFormComponent } from '../category-form.component';
import { Category } from '../../../../models/model';
import { CategoryService } from '../../../../services/category.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, CategoryFormComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css',
  standalone: true,
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  showForm = false;
  editingCategory: Category | null = null;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastTimer: any;
  toastOffset = 72;
  showDeleteConfirm = false;
  categoryToDelete: Category | null = null;
  isDeleting = false;

  constructor(private categoryService: CategoryService, private router: Router) {}

  ngOnInit(): void {
    this.categoryService.getAllCategories().subscribe((categories) => {
      this.categories = categories;
    });
  }

  openAddForm(): void {
    this.editingCategory = null;
    this.showForm = true;
  }

  openEditForm(category: Category): void {
    this.editingCategory = category;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingCategory = null;
  }

  toggleStatus(category: Category): void {
    const targetStatus = category.isActive ? 'deactivated' : 'activated';
    this.categoryService.toggleCategoryStatus(category.categoryID).subscribe({
      next: () => {
        this.showToast(`Category ${targetStatus} successfully`, 'success');
      },
      error: (error) => {
        console.error('Error toggling category status:', error);
        this.showToast('Failed to toggle category status. Please try again.', 'error');
      },
    });
  }

  promptDelete(category: Category): void {
    if (this.categories.length <= 1) {
      this.showToast('You must keep at least one category.', 'error');
      return;
    }

    this.categoryToDelete = category;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.categoryToDelete = null;
  }

  confirmDelete(): void {
    if (!this.categoryToDelete || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.categoryService.deleteCategory(this.categoryToDelete.categoryID).subscribe({
      next: () => {
        // Category list will be updated automatically via the service
        this.cancelDelete();
        this.showToast('Category deleted successfully', 'success');
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.isDeleting = false;
        this.cancelDelete();
        this.showToast('Cannot delete this category because it has linked ideas.', 'error');
        this.router.navigate(['/admin/categories']);
      },
      complete: () => {
        this.isDeleting = false;
      },
    });
  }

  onFormSaved(): void {
    const wasEdit = !!this.editingCategory;
    this.closeForm();
    this.showToast(
      wasEdit ? 'Category updated successfully' : 'Category created successfully',
      'success',
    );
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
