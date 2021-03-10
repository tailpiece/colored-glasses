# Colored glasses

This is a browser extension.  
View the web with colored glasses. It is possible to see the plaster statue in gold, silver, copper, and bronze.

## Browser Support

This functionality is currently supported on desktop Chrome and Firefox.

## Contributing

- DO NOT directly modify the popup.js file in the package/popup. These files are automatically built from components located under the src/ directory.
The project uses webpack to automate the build process.

- Edit content / content.js directly.
- Duplicate content / gradientmaps.js from the [GitHub repository](https://github.com/tailpiece/gradientmaps).

## Building and running on localhost

First install dependencies:

```sh
yarn install
```

To create a production build:

```sh
yarn run build
```

Running

```sh
yarn run dev
```

## Credits

- [Tail](https://tailpiece.dev/) - author
- Made with [createapp.dev](https://createapp.dev/) - project template
