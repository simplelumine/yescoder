import * as vscode from 'vscode';
import { ProfileResponse, BalanceResult } from '../types';
import { formatDate, calculateNextReset, getDaysUntil } from './utils';

export function calculateSubscriptionBalance(profile: ProfileResponse, reverseDisplay: boolean = false): BalanceResult {
    const {
        subscription_balance,
        pay_as_you_go_balance,
        current_week_spend,
        subscription_plan,
        balance_preference,
        last_week_reset,
        subscription_expiry
    } = profile;

    if (!subscription_plan || !subscription_expiry) {
        throw new Error('Subscription data is missing');
    }

    const nextReset = calculateNextReset(last_week_reset);
    const resetDate = new Date(last_week_reset);
    resetDate.setDate(resetDate.getDate() + 7);
    const resetRelative = getDaysUntil(resetDate.toISOString());
    const expiryDate = formatDate(subscription_expiry);
    const expiryRelative = getDaysUntil(subscription_expiry);

    const weeklyRemaining = subscription_plan.weekly_limit - current_week_spend;

    const dailyPercentage = (subscription_balance / subscription_plan.daily_balance) * 100;
    const weeklyPercentage = (weeklyRemaining / subscription_plan.weekly_limit) * 100;
    const isCriticalDaily = dailyPercentage <= weeklyPercentage;

    let displayPercentage: number;
    let displayTextValues: string;

    if (isCriticalDaily) {
        displayPercentage = dailyPercentage;
        if (reverseDisplay) {
            const usedPercentage = 100 - dailyPercentage;
            displayTextValues = `${usedPercentage.toFixed(0)}%`;
        } else {
            displayTextValues = `${dailyPercentage.toFixed(0)}%`;
        }
    } else {
        displayPercentage = weeklyPercentage;
        if (reverseDisplay) {
            const usedPercentage = 100 - weeklyPercentage;
            displayTextValues = `${usedPercentage.toFixed(0)}%`;
        } else {
            displayTextValues = `${weeklyPercentage.toFixed(0)}%`;
        }
    }

    const tooltip = [
        vscode.l10n.t('Subscription Mode'),
        `${vscode.l10n.t('Plan')}: ${subscription_plan.name}`,
        `${vscode.l10n.t('Daily')}: $${subscription_balance.toFixed(2)} / $${subscription_plan.daily_balance.toFixed(2)} (${dailyPercentage.toFixed(1)}%)`,
        `${vscode.l10n.t('Weekly')}: $${weeklyRemaining.toFixed(2)} / $${subscription_plan.weekly_limit.toFixed(2)} (${weeklyPercentage.toFixed(1)}%)`,
        `${vscode.l10n.t('Reset')}: ${nextReset} (${resetRelative})`,
        `${vscode.l10n.t('Expiry')}: ${expiryDate} (${expiryRelative})`,
        ``,
        vscode.l10n.t('Click to open menu')
    ].join('\n');

    return {
        type: isCriticalDaily ? 'daily' : 'weekly',
        percentage: displayPercentage,
        displayText: `YesCode ${vscode.l10n.t('Subs')}: ${displayTextValues}`,
        tooltip
    };
}

