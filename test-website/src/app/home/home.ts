import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
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
