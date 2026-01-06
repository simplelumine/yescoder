import * as vscode from 'vscode';
import { buildProviderMenu } from './menu';
import { handleUserProviderSelection } from './userHandler';
import { handleTeamProviderSelection } from './teamHandler';
import { isProviderSwitchingAvailable } from '../api';

export async function showVendorSwitchMenu(context: vscode.ExtensionContext): Promise<void> {
    try {
        // Check if provider switching is available (not in test environment)
        if (!await isProviderSwitchingAvailable(context)) {
            vscode.window.showInformationMessage(vscode.l10n.t('Provider switching is not available in Test environment.'));
            return;
        }

        // Step 1: Build the provider menu
        const menuItems = await buildProviderMenu(context);

        if (!menuItems) {
            return;
        }

        // Step 2: Show the menu and get user selection
        const selectedProvider = await vscode.window.showQuickPick(menuItems, {
            placeHolder: 'Select a provider to switch',
            ignoreFocusOut: true
        });

        if (!selectedProvider || selectedProvider.kind === vscode.QuickPickItemKind.Separator) {
            return;
        }

        // Step 3: Handle the selection based on path
        if (selectedProvider.isTeam) {
            await handleTeamProviderSelection(context, selectedProvider);
        } else {
            await handleUserProviderSelection(context, selectedProvider);
        }
    } catch (error) {
        console.error('Error in showVendorSwitchMenu:', error);
        vscode.window.showErrorMessage(vscode.l10n.t('Failed to switch vendor: {0}', error instanceof Error ? error.message : vscode.l10n.t('Unknown error')));
    }
}
