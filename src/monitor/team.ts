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

    // Display the smaller percentage (more critical)
    const shouldShowDaily = dailyPercentage <= weeklyPercentage;

    let displayPercentage: number;
    let displayTextValues: string;

    if (shouldShowDaily) {
        displayPercentage = dailyPercentage;
        if (reverseDisplay) {
            // Inverted: Show Used %
            const usedPercentage = 100 - dailyPercentage;
            displayTextValues = `${usedPercentage.toFixed(0)}%`;
        } else {
             // Normal: Show Remaining %
            displayTextValues = `${dailyPercentage.toFixed(0)}%`;
        }
    } else {
        displayPercentage = weeklyPercentage;
        if (reverseDisplay) {
             // Inverted: Show Used %
            const usedPercentage = 100 - weeklyPercentage;
            displayTextValues = `${usedPercentage.toFixed(0)}%`;
        } else {
             // Normal: Show Remaining %
            displayTextValues = `${weeklyPercentage.toFixed(0)}%`;
        }
    }

    const tooltip = [
        `Team Mode`,
        `Group: ${current_team.name}`,
        `Daily: $${dailyRemaining.toFixed(2)} / $${dailyBalance.toFixed(2)} (${dailyPercentage.toFixed(1)}%)`,
        `Weekly: $${weeklyRemaining.toFixed(2)} / $${weeklyLimit.toFixed(2)} (${weeklyPercentage.toFixed(1)}%)`,
        `Reset: ${nextReset} (${resetRelative})`,
        `Expiry: ${expiryDate} (${expiryRelative})`,
        ``,
        'Click to open menu'
    ].join('\n');

    return {
        type: shouldShowDaily ? 'daily' : 'weekly',
        percentage: displayPercentage, // Always return REMAINING percentage for color logic
        displayText: `YesCode Team: ${displayTextValues}`,
        tooltip
    };
}
