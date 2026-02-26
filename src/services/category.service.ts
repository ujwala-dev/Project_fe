import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Category } from '../models/model';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private categories$ = new BehaviorSubject<Category[]>([]);
  private apiUrl = 'https://localhost:7175/api/Categorie/categories';

  constructor(private http: HttpClient) {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (categories) => {
        // Map backend response to frontend Category model
        const mappedCategories = categories.map((cat) => ({
          categoryID: cat.categoryId,
          name: cat.name,
          description: cat.description || '',
          isActive: cat.isActive,
          createdDate: '',
        }));
        this.categories$.next(mappedCategories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories$.next([]);
      },
    });
  }

  getAllCategories(): Observable<Category[]> {
    return this.categories$.asObservable();
  }

  getActiveCategories(): Category[] {
    return this.categories$.value.filter((c) => c.isActive);
  }

  getCategoryById(id: number | string): Category | undefined {
    return this.categories$.value.find((c) => c.categoryID === id);
  }

  createCategory(partial: Partial<Category>): Observable<Category> {
    const payload = {
      name: partial.name || 'Untitled Category',
      description: partial.description || '',
      isActive: partial.isActive !== undefined ? partial.isActive : true,
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      tap((response: any) => {
        const newCategory: Category = {
          categoryID: response.categoryId,
          name: response.name,
          description: response.description || '',
          isActive: response.isActive,
        };
        const categories = [...this.categories$.value, newCategory];
        this.categories$.next(categories);
      }),
    );
  }

  updateCategory(
    id: number | string,
    updates: Partial<Category>,
  ): Observable<any> {
    const payload = {
      name: updates.name,
      description: updates.description,
      isActive: updates.isActive,
    };

    return this.http.put(`${this.apiUrl}/${id}`, payload).pipe(
      tap(() => {
        const categories = this.categories$.value.map((c) =>
          c.categoryID === id ? { ...c, ...updates } : c,
        );
        this.categories$.next(categories);
      }),
    );
  }

  deleteCategory(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const categories = this.categories$.value.filter(
          (c) => c.categoryID !== id,
        );
        this.categories$.next(categories);
      }),
    );
  }
  toggleCategoryStatus(id: number | string): Observable<any> {
    const category = this.getCategoryById(id);
    if (!category) {
      return throwError(() => new Error('Category not found'));
    }

    const updatedData = {
      name: category.name,
      description: category.description,
      isActive: !category.isActive,
    };

    return this.updateCategory(id, updatedData);
  }
}
