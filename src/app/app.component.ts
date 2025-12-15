import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "../components/navbar/navbar.component";
import { LandingpageComponent } from "../components/landingpage/landingpage.component";

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, LandingpageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
