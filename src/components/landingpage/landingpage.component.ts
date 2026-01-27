import { TypewriterDirective } from './typewriter.directive';

import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FooterComponent } from "../footer/footer.component";
import { HomeComponent } from "../home/home.component";


@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent, HomeComponent], // <-- NgIf, ng-template, routerLink
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.css'],
})
export class LandingpageComponent implements OnInit {
  roles = [
    {
      title: 'Employee',
      icon: '/Employee.svg',
      description:
        'Submit innovative ideas and collaborate with team members to improve organizational processes.',
      features: [
        ' Submit your ideas',
        ' Vote on other ideas',
        ' Discuss and collaborate',
        ' Track idea progress',
      ],
      cta: 'Start as Employee',
      route: '/signup',
      color: '#3b82f6',
      decorated: false
    },
    {
      title: 'Manager',
      icon: '/Manager.svg',
      bgv: '/light-bulb.svg',
      description:
        'Review, manage, and track ideas from your team members. Make decisions and drive innovation.',
      features: [
        ' Review all ideas',
        ' Provide feedback',
        ' Approve/reject ideas',
        ' Team management',
      ],
      cta: 'Manage as Manager',
      route: '/signup',
      color: '#3b82f6',
      decorated: true
    },
    {
      title: 'Administrator',
      icon: '/Admin.svg',

      description:
        'Have full control over the entire system. Manage users, categories, and system‑wide settings.',
      features: [
        ' Full system access',
        ' User management',
        ' Custom categories',
        ' Advanced analytics',
      ],
      cta: 'Manage as Admin',
      route: '/signup',
      color: '#3b82f6',
      decorated: false
    },
  ];
  constructor(private router: Router) { }

  ngOnInit(): void { }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
