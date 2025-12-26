# Translation File Editor

A simple editor for translation files (e.g. XLIFF 1.2, XLIFF 2.0). 

Built with Angular, Tailwind CSS.

## Key Features

- **Multi-Format Support**: Support parsing and exporting **XLIFF 1.2**, **XLIFF 2.0** and **JSON** formats.
- **Quick Filtering & Search**: Filter units by status (Total, Translated, Missing, Changed).  
- **No Server-side Processing**: All processing happens entirely in browser. Translation files are never uploaded to a server.

## Development

### Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

### Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```
