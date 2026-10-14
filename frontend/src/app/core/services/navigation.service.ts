import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(
    private location: Location,
    private router: Router
  ) {}

  goBack(): void {
    this.location.back();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
