import * as vscode from 'vscode';
import { ProfileResponse } from '../types';
import { DisplayMode } from '../monitor/balance';

export function buildMainMenu(showProviderSwitch: boolean = true): vscode.QuickPickItem[] {
    const items: vscode.QuickPickItem[] = [
        {
            label: `$(sync) ${vscode.l10n.t('Refresh Balance')}`,
            description: vscode.l10n.t('Manually refresh balance data')
        },
        {
            label: `$(symbol-color) ${vscode.l10n.t('Switch Display Mode')}`,
            description: vscode.l10n.t('Change between Auto/Subscription/PayGo/Team modes')
        }
    ];

    // Only show provider switching in production environment
    if (showProviderSwitch) {
        items.push({
            label: `$(arrow-swap) ${vscode.l10n.t('Switch Vendor')}`,
            description: vscode.l10n.t('Change provider vendor settings')
        });
    }

    items.push({
        label: `$(key) ${vscode.l10n.t('Set API Key')}`,
        description: vscode.l10n.t('Configure your YesCode API key')
    });

    items.push({
        label: `$(rocket) ${vscode.l10n.t('One-Click CLI Setup...')}`,
        description: vscode.l10n.t('Auto-execute or copy setup commands')
    });

    items.push({
        label: `$(globe) ${vscode.l10n.t('Switch Language')}`,
        description: vscode.l10n.t('Change YesCoder display language')
    });

    return items;
}

export function buildDisplayModeMenu(profile: ProfileResponse, currentDisplayMode: DisplayMode): vscode.QuickPickItem[] {
    const hasSubscription = !!profile.subscription_plan;
    const hasTeam = !!profile.current_team;
    const isPayGoOnly = profile.balance_preference === 'payg_only';

    return [
        {
            label: vscode.l10n.t('Auto'),
            description: vscode.l10n.t('Automatically detect mode based on account type'),
            detail: currentDisplayMode === 'auto' ? `✓ ${vscode.l10n.t('Currently selected')}` : ''
        },
        {
            label: vscode.l10n.t('Subscription'),
            description: hasSubscription
                ? (isPayGoOnly ? `⚠️ ${vscode.l10n.t('Warning: Your account is set to PayGo Only mode')}` : vscode.l10n.t('Always show subscription balance'))
                : `❌ ${vscode.l10n.t('Not available (no subscription)')}`,
            detail: currentDisplayMode === 'subscription' ? `✓ ${vscode.l10n.t('Currently selected')}` : ''
        },
        {
            label: vscode.l10n.t('PayGo'),
            description: (hasSubscription && !isPayGoOnly)
                ? `⚠️ ${vscode.l10n.t('Warning: Your account is set to Subscription First mode')}`
                : vscode.l10n.t('Always show pay-as-you-go balance'),
            detail: currentDisplayMode === 'paygo' ? `✓ ${vscode.l10n.t('Currently selected')}` : ''
        },
        {
            label: vscode.l10n.t('Team'),
            description: hasTeam
                ? vscode.l10n.t('Always show team balance')
                : `❌ ${vscode.l10n.t('Not available (no team)')}`,
            detail: currentDisplayMode === 'team' ? `✓ ${vscode.l10n.t('Currently selected')}` : ''
        }
    ];
}
