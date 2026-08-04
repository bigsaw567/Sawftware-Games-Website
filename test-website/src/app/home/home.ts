import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html'
})
export class Home {
  constructor(private router: Router) {}

  goLogin() 
  {
    this.router.navigate(['/login']);
  }

  goSignup() 
  {
    this.router.navigate(['/signup']);
  }
}
