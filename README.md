# [Dodoco](https://github.com/colazcy/dodoco)

Dodoco is a lightweight application specifically designed for playing audio files from the Gaokao English listening test (or its practice exam).

It analyzes the audio, detects silences longer than a specified threshold, and uses them to split the audio into ready-to-play clips. Dodoco also contains an AI model that can classify the clips by language, which is highly convenient for English teachers.

## Features

- Easily drag and drop audio files for analysis and playback
- Cross-platform support

## Contributing

Contributions are welcome! Feel free to open an issue to report bugs, suggest new features, or submit a pull request to help improve the project.

## Developing

You can run `pnpm tauri build` to build Dodoco, and `pnpm tauri dev` to develop it.

For macOS users, if you find it significantly slow when developing Dodoco, please refer to [this blog](https://yuexun.me/how-to-make-your-tauri-dev-faster/).

## License and Acknowledgements

This project is licensed under the MIT License. For more details, refer to the LICENSE file.

The AI model is heavily inspired by [TaoRuijie/ECAPA-TDNN](https://github.com/TaoRuijie/ECAPA-TDNN). Thanks to the authors for opening their source code!
