# Giffos


![Giffos Screenshot](src-tauri/icons/Square150x150Logo.png)

A lightweight, always-on-top GIF search and clipboard utility built with Tauri and React. Quickly search for GIFs using the GIPHY API and copy them to your clipboard with a single click.

![Giffos Screenshot](public/giphy.png)

## Preview

![Giffos Preview](giffos.gif)

## Features

- 🔍 Search for GIFs using GIPHY's extensive library
- 📋 Copy GIFs to clipboard with one click
- 🪟 Always-on-top window for easy access
- 🖥️ Toggle between HD and standard quality
- ⚡ Lightweight and fast native application
- 🔒 Secure - your GIPHY API key is stored locally

## Installation
- Download the latest release from [GitHub](https://github.com/digitalartifactory/giffos/releases)

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Build from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/digitalartifactory/giffos.git
   cd giffos
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your GIPHY API key:
   - Get an API key from [GIPHY Developers](https://developers.giphy.com/)
   - The app will prompt you to enter your API key on first launch

4. Run in development mode:
   ```bash
   npm run tauri dev
   ```

5. Build the application:
   ```bash
   npm run tauri build
   ```

## Usage

1. Launch Giffos
2. Configure your GIPHY API key
3. Enter your search query in the search bar
4. Browse through the results using the arrow keys or mouse
5. Click on a GIF to copy it to your clipboard
6. Paste (Ctrl+V) the GIF into any application that supports image pasting

## Configuration

Giffos stores its configuration in your system's application data directory. You can configure:

- GIPHY API key (saved automatically)

## Building for Distribution

To create an installer:

```bash
npm run tauri build
```

The installer will be available in the `src-tauri/target/release` directory.

## Updating

Giffos includes an automatic update system. New versions will be downloaded and installed automatically when available.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Tauri](https://tauri.app/) - For the amazing framework
- [GIPHY](https://giphy.com/) - For the GIF API
- [React](https://reactjs.org/) - For the UI library
- [Tailwind CSS](https://tailwindcss.com/) - For styling