import * as vscode from 'vscode';
import { ProfileResponse, BalanceResult } from '../types';

export function calculatePayGoBalance(profile: ProfileResponse): BalanceResult {
    const { pay_as_you_go_balance } = profile;

    const tooltip = [
        vscode.l10n.t('Pay-as-you-go Mode'),
        `${vscode.l10n.t('Balance')}: $${pay_as_you_go_balance.toFixed(2)}`,
        ``,
        vscode.l10n.t('Click to open menu')
    ].join('\n');

    return {
        type: 'payGo',
        percentage: pay_as_you_go_balance,
        displayText: `YesCode ${vscode.l10n.t('Pgo')}: $${pay_as_you_go_balance.toFixed(1)}`,
        tooltip
    };
}

