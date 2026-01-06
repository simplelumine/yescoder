import * as vscode from 'vscode';
import { ProfileResponse, BalanceResult } from '../types';
import { formatDate, calculateNextReset, getDaysUntil } from './utils';

export function calculateTeamBalance(profile: ProfileResponse, reverseDisplay: boolean = false): BalanceResult {
    const { current_team, team_membership } = profile;

    if (!current_team || !team_membership) {
        throw new Error('Team data is missing');
    }

    const nextReset = calculateNextReset(team_membership.last_week_reset);
    const resetDate = new Date(team_membership.last_week_reset);
    resetDate.setDate(resetDate.getDate() + 7);
    const resetRelative = getDaysUntil(resetDate.toISOString());
    const expiryDate = formatDate(team_membership.expires_at);
    const expiryRelative = getDaysUntil(team_membership.expires_at);

    const dailyBalance = current_team.per_user_daily_balance;
    const dailySpent = team_membership.daily_subscription_spending;
    const dailyRemaining = dailyBalance - dailySpent;

    const weeklyLimit = current_team.weekly_limit;
    const weeklySpent = team_membership.current_week_spend;
    const weeklyRemaining = weeklyLimit - weeklySpent;

    const dailyPercentage = (dailyRemaining / dailyBalance) * 100;
    const weeklyPercentage = (weeklyRemaining / weeklyLimit) * 100;

    const shouldShowDaily = dailyPercentage <= weeklyPercentage;

    let displayPercentage: number;
    let displayTextValues: string;

    if (shouldShowDaily) {
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

    // Calculate display values for tooltip based on reverseDisplay
    const displayDailyPct = reverseDisplay ? (100 - dailyPercentage) : dailyPercentage;
    const displayWeeklyPct = reverseDisplay ? (100 - weeklyPercentage) : weeklyPercentage;
    
    // Calculate display amounts (remaining or used)
    const displayDailyAmount = reverseDisplay ? dailySpent : dailyRemaining;
    const displayWeeklyAmount = reverseDisplay ? weeklySpent : weeklyRemaining;

    const tooltip = [
        vscode.l10n.t('Team Mode'),
        `${vscode.l10n.t('Group')}: ${current_team.name}`,
        `${vscode.l10n.t('Daily')}: $${displayDailyAmount.toFixed(2)} / $${dailyBalance.toFixed(2)} (${displayDailyPct.toFixed(1)}%)`,
        `${vscode.l10n.t('Weekly')}: $${displayWeeklyAmount.toFixed(2)} / $${weeklyLimit.toFixed(2)} (${displayWeeklyPct.toFixed(1)}%)`,
        `${vscode.l10n.t('Reset')}: ${nextReset} (${resetRelative})`,
        `${vscode.l10n.t('Expiry')}: ${expiryDate} (${expiryRelative})`,
        ``,
        vscode.l10n.t('Click to open menu')
    ].join('\n');

    return {
        type: shouldShowDaily ? 'daily' : 'weekly',
        percentage: displayPercentage,
        displayText: `YesCode ${vscode.l10n.t('Team')}: ${displayTextValues}`,
        tooltip
    };
}

