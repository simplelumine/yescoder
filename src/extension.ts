import * as vscode from 'vscode';
import { createStatusBar, startAutoRefresh, stopAutoRefresh } from './core/statusbar';
import { registerCommands } from './core/commands';
import { showCliSetupMenu } from './setup';

export function activate(context: vscode.ExtensionContext) {
    console.log('YesCoder extension is now active');

    // Create and setup status bar
    const statusBarItem = createStatusBar(context);
    context.subscriptions.push(statusBarItem);

    // Register all commands
    registerCommands(context);

    // Register CLI setup command
    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.configureCliEnvironment', async () => {
            await showCliSetupMenu(context);
        })
    );

    // Start automatic refresh
    startAutoRefresh(context);

    // Clean up timer on deactivation
    context.subscriptions.push({
        dispose: () => {
            stopAutoRefresh();
        }
    });
}

export function deactivate() {
    stopAutoRefresh();
}
