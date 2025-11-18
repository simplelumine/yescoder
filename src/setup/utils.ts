import { ProfileResponse } from '../types';
import * as os from 'os';

/**
 * Extract team information from profile if user is an active team member
 */
export function getTeamInfo(profile: ProfileResponse): { teamApiKey: string; teamName: string } | null {
    // Check if user has an active team membership
    if (profile.team_membership && profile.current_team) {
        // Team API keys would be stored in a team-specific format
        // For now, we'll use a placeholder approach - the actual implementation
        // would depend on how team API keys are provided by the backend
        return {
            teamApiKey: 'team', // Placeholder - actual team API key retrieval would be implemented
            teamName: profile.current_team.name
        };
    }
    return null;
}

/**
 * Detect the operating system
 */
export function getOperatingSystem(): 'windows' | 'unix' {
    const platform = os.platform();
    return platform === 'win32' ? 'windows' : 'unix';
}
