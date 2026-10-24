import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

// Replace entries with your game titles, descriptions, and cover image paths.
export interface Game { title: string; description: string; cover: string; }
@Component({ selector: 'app-games', imports: [RouterLink], templateUrl: './games.html' })
export class Games {
  readonly published = inject(ActivatedRoute).snapshot.data['published'] === true;
  readonly developmentGames: Game[] = [
    { title: 'Your game title', description: 'Introduce your game here. Share its world, what players will do, and what makes the experience special.', cover: '' },
    { title: 'Your next game', description: 'A space for your next adventure. Add a short description and cover art when you’re ready to share more.', cover: '' }
  ];
  readonly publishedGames: Game[] = [
    { title: 'Your published game', description: 'Introduce a released game here. Describe the experience and what makes it worth playing.', cover: '' },
    { title: 'Your next release', description: 'A space for another published game. Add its cover art and a short description when it launches.', cover: '' }
  ];
  get games(): Game[] { return this.published ? this.publishedGames : this.developmentGames; }
}
