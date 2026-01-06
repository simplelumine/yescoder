import * as vscode from 'vscode';
import { fetchBalance, setApiKey, isProviderSwitchingAvailable } from '../api';
import { DisplayMode } from '../monitor/balance';
import { showVendorSwitchMenu } from '../providers';
import { updateStatusBar, setDisplayMode, getDisplayMode } from './statusbar';
import { buildMainMenu, buildDisplayModeMenu } from './menu';

export function registerCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.showMenu', async () => {
            await handleShowMenu(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.setApiKey', async () => {
            await handleSetApiKey(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.refreshBalance', async () => {
            await handleRefreshBalance(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.switchDisplayMode', async () => {
            await handleSwitchDisplayMode(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('yescode.switchVendor', async () => {
            await handleSwitchVendor(context);
        })
    );
}

async function handleShowMenu(context: vscode.ExtensionContext): Promise<void> {
    const showProviderSwitch = await isProviderSwitchingAvailable(context);
    const items = buildMainMenu(showProviderSwitch);

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: vscode.l10n.t('YesCode Menu')
    });

    if (selected) {
        if (selected.label.includes('Refresh Balance')) {
            await vscode.commands.executeCommand('yescode.refreshBalance');
        } else if (selected.label.includes('Switch Display Mode')) {
            await vscode.commands.executeCommand('yescode.switchDisplayMode');
        } else if (selected.label.includes('Switch Vendor')) {
            await vscode.commands.executeCommand('yescode.switchVendor');
        } else if (selected.label.includes('Set API Key')) {
            await vscode.commands.executeCommand('yescode.setApiKey');
        } else if (selected.label.includes('One-Click CLI Setup')) {
            await vscode.commands.executeCommand('yescode.configureCliEnvironment');
        } else if (selected.label.includes('Switch Language')) {
            await vscode.commands.executeCommand('workbench.action.configureLocale');
        }
    }
}

async function handleSetApiKey(context: vscode.ExtensionContext): Promise<void> {
    await setApiKey(context);
    await updateStatusBar(context, false);
}

async function handleRefreshBalance(context: vscode.ExtensionContext): Promise<void> {
    await updateStatusBar(context, false);
}

async function handleSwitchDisplayMode(context: vscode.ExtensionContext): Promise<void> {
    // Fetch current profile to check available modes
    const profile = await fetchBalance(context);

    if (!profile) {
        vscode.window.showErrorMessage(vscode.l10n.t('Failed to fetch account data. Please try again.'));
        return;
    }

    const currentDisplayMode = getDisplayMode();
    const items = buildDisplayModeMenu(profile, currentDisplayMode);

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: vscode.l10n.t('Select display mode')
    });

    if (selected) {
        const modeMap: { [key: string]: DisplayMode } = {
            'Auto': 'auto',
            'Subscription': 'subscription',
            'PayGo': 'paygo',
            'Team': 'team'
        };

        const newMode = modeMap[selected.label];
        const hasSubscription = !!profile.subscription_plan;
        const hasTeam = !!profile.current_team;
        const isPayGoOnly = profile.balance_preference === 'payg_only';

        // Warn if selecting modes that conflict with balance preference
        if (newMode === 'subscription' && !hasSubscription) {
            vscode.window.showWarningMessage(vscode.l10n.t('No subscription found. Will fall back to PayGo mode.'));
        } else if (newMode === 'subscription' && isPayGoOnly) {
            const confirm = await vscode.window.showWarningMessage(
                vscode.l10n.t('Your account is set to PayGo Only mode. Switching to Subscription display may show incorrect data.'),
                vscode.l10n.t('Continue Anyway'),
                vscode.l10n.t('Cancel')
            );
            if (confirm !== vscode.l10n.t('Continue Anyway')) {
                return;
            }
        } else if (newMode === 'paygo' && hasSubscription && !isPayGoOnly) {
            const confirm = await vscode.window.showWarningMessage(
                vscode.l10n.t('Your account is set to Subscription First mode. Switching to PayGo display may not reflect your actual usage.'),
                vscode.l10n.t('Continue Anyway'),
                vscode.l10n.t('Cancel')
            );
            if (confirm !== vscode.l10n.t('Continue Anyway')) {
                return;
            }
        } else if (newMode === 'team' && !hasTeam) {
            vscode.window.showWarningMessage(vscode.l10n.t('No team found. Will fall back to available mode.'));
        }

        setDisplayMode(newMode);
        await context.globalState.update('displayMode', newMode);
        await updateStatusBar(context, false);

        vscode.window.showInformationMessage(vscode.l10n.t('Display mode switched to: {0}', selected.label));
    }
}

async function handleSwitchVendor(context: vscode.ExtensionContext): Promise<void> {
    await showVendorSwitchMenu(context);
}
