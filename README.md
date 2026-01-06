# YesCoder

[中文文档](./README_zh-CN.md)

- **Official Website:** [https://co.yes.vg](https://co.yes.vg)
- **Test Website:** [https://cotest.yes.vg](https://cotest.yes.vg)
- **Plugin Feedback:** [Report an Issue](https://github.com/simplelumine/yescoder/issues)
- **Official Community:** [Discord](https://discord.gg/AXxg7qM358) | [Telegram](https://t.me/yes_code)
- **VS Code Marketplace:** [Download Extension](https://marketplace.visualstudio.com/items?itemName=simplelumine.yescoder)

Your essential companion for YesCode in VS Code. Monitor your balance seamlessly from the status bar.

## Features

- **Balance Monitoring:** Keep an eye on your most critical balance (Team, Subscription, or PayGo) directly in the status bar.
- **One-Click CLI Setup**: Quickly configure your local CLI environment to use YesCode's model relay services (Gemini, Codex, Claude, etc.). The helper intelligently detects your OS and environment to provide the correct variable setup commands, allowing you to use YesCode resources directly in your terminal.
- **Reverse Display Mode:** Switch between showing "Remaining" percentage (default) and "Used" percentage (reverse) to suit your preference.
- **Seamless Account Support:** Works with all types of YesCode accounts, including production and special/testing accounts, by automatically connecting to the correct backend services.
- **Centralized Command Menu:** A single click on the status bar opens a menu with all core extension commands.
- **Smart Display Modes:** Automatically detects the most relevant balance to display, with a manual override to lock it to a specific mode.
- **Detailed Tooltips:** Hover over the status bar for a mini-dashboard with a full breakdown of your current balance.
- **Secure API Key Storage:** Uses VS Code's native `SecretStorage` to keep your API key safe.
- **Automatic Refresh:** Keeps your balance up-to-date by automatically refreshing every minute.

## Setup

1.  Install the extension from the VS Code Marketplace.
2.  Click the "YesCode: Loading..." item in the status bar to open the menu.
3.  Select `Set API Key` and enter your YesCode API key when prompted. The extension will automatically detect the correct environment.
4.  Your balance and provider management features are now active.

## Configuration

You can configure YesCoder in your VS Code settings or via the command menu.

- `yescode.reverseDisplay`: (Boolean) Controls the balance display method.
  - `false` (Default): Shows **Remaining** percentage (e.g., 100% -> 0%).
  - `true`: Shows **Used** percentage (e.g., 0% -> 100%).

## Commands

- **`YesCode: One-Click CLI Setup`**: Opens the CLI setup helper.
- **`YesCode: Show Menu`**: Opens the main command menu from the status bar.
- **`YesCode: Refresh Balance`**: Manually refreshes your balance information.
- **`YesCode: Switch Display Mode`**: Manually selects which balance to display.
- **`YesCode: Set API Key`**: Stores your API key securely.
- _(Deprecated)_ **`YesCode: Switch Vendor`**: This command is deprecated. Please use the web dashboard.

## Acknowledgements

Special thanks to:

- **好果汁 (YesCode CFO)** for the testing environment and support.
- **YesCode CTO** for the project name suggestion.
- **喵酱 (YesCode User: 太阳照常升起)** for the API documentation reference.
- **萝拉酱 (YesCode User: Aurora)** for testing and feedback.
- **杰森酱 (YesCode User: Jason 🅥)** for valuable findings and suggestions.

## Project Architecture

This extension is built with a clean, feature-driven architecture:

- `src/extension.ts`: The main activation file that orchestrates the different features.
- `src/core/`: Contains the core logic for command registration and status bar creation.
- `src/monitor/`: All logic for the balance monitoring feature.
- `src/providers/`: All logic for the provider management feature.
- `src/setup/`: All logic for the CLI setup helper feature.
- `src/api.ts`: Manages all API calls to YesCode, including environment detection.
- `src/types.ts`: Defines all shared data structures.

## Development

```bash
# Clone the repository
git clone https://github.com/simplelumine/yescoder.git
cd yescoder

# Install dependencies
npm install

# Compile and watch for changes
npm run watch

# Open in VS Code and press F5 to launch the Extension Development Host.
```

## License

[MIT](./LICENSE.md)
