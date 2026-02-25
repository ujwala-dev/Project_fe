import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CategoryFormComponent } from '../category-form.component';
import { Category } from '../../../../models/model';
import { CategoryService } from '../../../../services/category.service';

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
  successMessage = '';
  private successTimeout: any;
  showDeleteConfirm = false;
  categoryToDelete: Category | null = null;
  isDeleting = false;

  constructor(private categoryService: CategoryService) {}

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
    this.categoryService.toggleCategoryStatus(category.categoryID);
  }

  promptDelete(category: Category): void {
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
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      },
      complete: () => {
        this.isDeleting = false;
      },
    });
  }

  onFormSaved(): void {
    const wasEdit = !!this.editingCategory;
    this.closeForm();
    this.showSuccess(wasEdit ? 'Category updated successfully' : 'Category created successfully');
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    this.successTimeout = setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}
