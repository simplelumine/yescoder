import * as vscode from 'vscode';
import { ProfileResponse } from '../types';
import { DisplayMode } from '../monitor/balance';

export function buildMainMenu(showProviderSwitch: boolean = true): vscode.QuickPickItem[] {
    const items: vscode.QuickPickItem[] = [
        {
            label: '$(sync) Refresh Balance',
            description: 'Manually refresh balance data'
        },
        {
            label: '$(symbol-color) Switch Display Mode',
            description: 'Change between Auto/Subscription/PayGo/Team modes'
        }
    ];

    // Only show provider switching in production environment
    if (showProviderSwitch) {
        items.push({
            label: '$(arrow-swap) Switch Vendor',
            description: 'Change provider vendor settings'
        });
    }

    items.push({
        label: '$(key) Set API Key',
        description: 'Configure your YesCode API key'
    });

    items.push({
        label: '$(tools) Configure CLI Environment',
        description: 'One-click setup for YesCode CLIs'
    });

    return items;
}

export function buildDisplayModeMenu(profile: ProfileResponse, currentDisplayMode: DisplayMode): vscode.QuickPickItem[] {
    const hasSubscription = !!profile.subscription_plan;
    const hasTeam = !!profile.current_team;
    const isPayGoOnly = profile.balance_preference === 'payg_only';

    return [
        {
            label: 'Auto',
            description: 'Automatically detect mode based on account type',
            detail: currentDisplayMode === 'auto' ? '✓ Currently selected' : ''
        },
        {
            label: 'Subscription',
            description: hasSubscription
                ? (isPayGoOnly ? '⚠️ Warning: Your account is set to PayGo Only mode' : 'Always show subscription balance')
                : '❌ Not available (no subscription)',
            detail: currentDisplayMode === 'subscription' ? '✓ Currently selected' : ''
        },
        {
            label: 'PayGo',
            description: (hasSubscription && !isPayGoOnly)
                ? '⚠️ Warning: Your account is set to Subscription First mode'
                : 'Always show pay-as-you-go balance',
            detail: currentDisplayMode === 'paygo' ? '✓ Currently selected' : ''
        },
        {
            label: 'Team',
            description: hasTeam
                ? 'Always show team balance'
                : '❌ Not available (no team)',
            detail: currentDisplayMode === 'team' ? '✓ Currently selected' : ''
        }
    ];
}
