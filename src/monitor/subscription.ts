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
        `Subscription Mode`,
        `Plan: ${subscription_plan.name}`,
        `Daily: $${subscription_balance.toFixed(2)} / $${subscription_plan.daily_balance.toFixed(2)} (${dailyPercentage.toFixed(1)}%)`,
        `Weekly: $${weeklyRemaining.toFixed(2)} / $${subscription_plan.weekly_limit.toFixed(2)} (${weeklyPercentage.toFixed(1)}%)`,
        `Reset: ${nextReset} (${resetRelative})`,
        `Expiry: ${expiryDate} (${expiryRelative})`,
        ``,
        'Click to open menu'
    ].join('\n');

    return {
        type: isCriticalDaily ? 'daily' : 'weekly',
        percentage: displayPercentage, // Always return REMAINING percentage for color logic
        displayText: `YesCode Subs: ${displayTextValues}`,
        tooltip
    };
}
