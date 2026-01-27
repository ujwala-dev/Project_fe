import { Component } from '@angular/core';
import { TypewriterDirective } from "../landingpage/typewriter.directive";
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [TypewriterDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(private Router: Router) { }
navigateTo(route: string): void {
    this.Router.navigate([route]);
  }
}
