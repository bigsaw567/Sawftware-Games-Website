import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

// Replace entries with your game titles, descriptions, and cover image paths.
export interface Game { title: string; description: string; cover: string; gamelink: string; }
@Component({ selector: 'app-games', imports: [RouterLink], templateUrl: './games.html' })
export class Games {
  readonly published = inject(ActivatedRoute).snapshot.data['published'] === true;
  readonly developmentGames: Game[] = [
    { title: 'Luck of an Irishman', description: 'This a community builder story game based in 1500s Ireland. Build, expand, and survive diseases, wildlife, and unlucky circumstances.', cover: 'House1.png' , gamelink: 'https://play.unity.com/en/games/8d88f9c1-0fd9-44b2-8db6-4326db3d90bd/luckofanirishmanwebsiterelease'},
    { title: 'Our next game', description: '', cover: '', gamelink: ''}
  ];
  readonly publishedGames: Game[] = [
    { title: 'Our published game', description: '', cover: '', gamelink: '' },
    { title: 'Our next release', description: '', cover: '', gamelink: '' }
  ];
  get games(): Game[] { return this.published ? this.publishedGames : this.developmentGames; }
}
