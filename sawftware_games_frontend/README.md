# Sawftware Games

Black and red Angular studio website with shared navigation, home/developer profiles, matching development and published game catalogs, login, signup, and a feedback/bug report form.

## Updating content

- Developer photo, name, career title, and biography: `src/app/home/home.html`. Replace the `portrait-placeholder` block with your image when ready.
- Game titles, descriptions, and covers: `developmentGames` and `publishedGames` in `src/app/games/games.ts`. Place cover files in `public/` and set `cover` to their path (for example, `/covers/my-game.webp`). The two catalogs share `src/app/games/games.html`.
- Theme and responsive layouts: `src/styles.css`.

## API integration

Existing login and signup requests remain in `src/app/services/auth.service.ts`. Successful login returns to the home page; the old `/dashboard` URL also redirects there.

The feedback form expects `POST http://localhost:5014/api/feedback`, with credentials enabled and a JSON body containing `name`, `email`, `category` (`feedback`, `bug`, or `idea`), optional `game`, `subject`, and `message`. It shows success only after a successful HTTP response and preserves entered content if a request fails. Implement this endpoint against your planned feedback table; this frontend change does not create a database table or backend endpoint. Validate these fields server-side as well. Update the API URLs for production hosting.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
