import { ProfileResponse, BalanceResult } from '../types';
import { calculateSubscriptionBalance } from './subscription';
import { calculateTeamBalance } from './team';
import { calculatePayGoBalance } from './paygo';

export type DisplayMode = 'auto' | 'subscription' | 'team' | 'paygo';

export function calculateBalance(data: ProfileResponse, mode: DisplayMode = 'auto', reverseDisplay: boolean = false): BalanceResult {
    // If forced to subscription mode
    if (mode === 'subscription') {
        if (!data.subscription_plan) {
            // No subscription, fall back to PayGo
            return calculatePayGoBalance(data);
        }
        return calculateSubscriptionBalance(data, reverseDisplay);
    }

    // If forced to team mode
    if (mode === 'team') {
        if (!data.current_team) {
            // No team, fall back to subscription or PayGo
            if (data.subscription_plan) {
                return calculateSubscriptionBalance(data, reverseDisplay);
            }
            return calculatePayGoBalance(data);
        }
        return calculateTeamBalance(data, reverseDisplay);
    }

    // If forced to PayGo mode
    if (mode === 'paygo') {
        return calculatePayGoBalance(data);
    }

    // Auto mode: Intelligent detection
    // Priority: Team > Subscription (respect balance_preference) > PayGo
    if (data.current_team) {
        return calculateTeamBalance(data, reverseDisplay);
    } else if (data.subscription_plan) {
        // Check if user prefers PayGo only
        if (data.balance_preference === 'payg_only') {
            return calculatePayGoBalance(data);
        }
        return calculateSubscriptionBalance(data, reverseDisplay);
    } else {
        // No subscription or team, use PayGo
        return calculatePayGoBalance(data);
    }
}
