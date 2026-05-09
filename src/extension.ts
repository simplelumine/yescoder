import * as vscode from 'vscode';
import { createStatusBar, startAutoRefresh, stopAutoRefresh } from './core/statusbar';
import { registerCommands } from './core/commands';
import { showCliSetupMenu } from './setup';
import { logger } from './core/logger';

export function activate(context: vscode.ExtensionContext) {
    try {
        logger.log('YesCoder extension activation started');

        // Create and setup status bar
        const statusBarItem = createStatusBar(context);
        context.subscriptions.push(statusBarItem);
        logger.log('Status bar created');

        // Register all commands
        registerCommands(context);
        logger.log('Commands registered');

        // Register CLI setup command
        context.subscriptions.push(
            vscode.commands.registerCommand('yescode.configureCliEnvironment', async () => {
                await showCliSetupMenu(context);
            })
        );
        logger.log('CLI Setup menu registered');

        // Start automatic refresh
        startAutoRefresh(context);
        logger.log('Automatic refresh started');

        // Clean up timer on deactivation
        context.subscriptions.push({
            dispose: () => {
                stopAutoRefresh();
                logger.log('YesCoder extension deactivated');
            }
        });

        logger.log('YesCoder extension is now fully active');
    } catch (error) {
        logger.error('Failed to activate YesCoder extension', error);
        logger.show();
    }
}

export function deactivate() {
    stopAutoRefresh();
}
