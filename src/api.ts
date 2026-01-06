import * as vscode from 'vscode';
import {
    ProfileResponse,
    AvailableProviderResponse,
    ProviderAlternativesResponse,
    ProviderSelectionResponse,
    TeamProviderAlternativesResponse,
    TeamProviderSelectionResponse
} from './types';

// ============================================================================
// Environment Detection
// ============================================================================

export type Environment = 'production' | 'test';

const ENVIRONMENTS = {
    production: 'https://co.yes.vg',
    test: 'https://cotest.yes.vg'
};

/**
 * Detect which environment the API key belongs to
 */
async function detectEnvironment(apiKey: string): Promise<Environment | null> {
    console.log('Detecting environment for API key...');

    // Test both environments concurrently
    const results = await Promise.allSettled([
        fetch(`${ENVIRONMENTS.production}/api/v1/auth/profile`, {
            method: 'GET',
            headers: { 'X-API-Key': apiKey }
        }),
        fetch(`${ENVIRONMENTS.test}/api/v1/auth/profile`, {
            method: 'GET',
            headers: { 'X-API-Key': apiKey }
        })
    ]);

    const [prodResult, testResult] = results;

    // Check production environment
    if (prodResult.status === 'fulfilled' && prodResult.value.ok) {
        console.log('✓ API key belongs to PRODUCTION environment');
        return 'production';
    }

    // Check test environment
    if (testResult.status === 'fulfilled' && testResult.value.ok) {
        console.log('✓ API key belongs to TEST environment');
        return 'test';
    }

    console.log('✗ API key is invalid in both environments');
    return null;
}

/**
 * Get the current environment from storage
 */
export async function getCurrentEnvironment(context: vscode.ExtensionContext): Promise<Environment> {
    return context.globalState.get<Environment>('yescode.environment', 'production');
}

/**
 * Get the base URL for the current environment
 */
export async function getBaseUrl(context: vscode.ExtensionContext): Promise<string> {
    const env = await getCurrentEnvironment(context);
    return ENVIRONMENTS[env];
}

/**
 * Check if provider switching is available (not available in test environment)
 */
export async function isProviderSwitchingAvailable(context: vscode.ExtensionContext): Promise<boolean> {
    const env = await getCurrentEnvironment(context);
    return env === 'production';
}

// ============================================================================
// API Key Management
// ============================================================================

export async function fetchBalance(context: vscode.ExtensionContext): Promise<ProfileResponse | null> {
    const apiKey = await context.secrets.get('yescode.apiKey');

    if (!apiKey) {
        // API key not set - show warning once (this is a configuration issue, not a network error)
        vscode.window.showWarningMessage(
            vscode.l10n.t('YesCode API Key not set. Please run "YesCode: Set API Key" command.'),
            vscode.l10n.t('Set API Key')
        ).then(selection => {
            if (selection === vscode.l10n.t('Set API Key')) {
                vscode.commands.executeCommand('yescode.setApiKey');
            }
        });
        return null;
    }

    const baseUrl = await getBaseUrl(context);
    const response = await fetch(`${baseUrl}/api/v1/auth/profile`, {
        method: 'GET',
        headers: {
            'X-API-Key': apiKey
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as ProfileResponse;
    return data;
    // Network errors will be thrown and caught by statusbar.ts for retry handling
}

export async function setApiKey(context: vscode.ExtensionContext): Promise<void> {
    const apiKey = await vscode.window.showInputBox({
        prompt: vscode.l10n.t('Enter your YesCode API Key'),
        password: true,
        ignoreFocusOut: true,
        placeHolder: vscode.l10n.t('Your API key will be stored securely')
    });

    if (!apiKey) {
        vscode.window.showWarningMessage(vscode.l10n.t('API Key not saved'));
        return;
    }

    // Show progress while detecting environment
    const env = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: vscode.l10n.t('Validating API Key...'),
        cancellable: false
    }, async () => {
        return await detectEnvironment(apiKey);
    });

    if (!env) {
        vscode.window.showErrorMessage(vscode.l10n.t('Invalid API Key. Please check and try again.'));
        return;
    }

    // Save API key and environment
    await context.secrets.store('yescode.apiKey', apiKey);
    await context.globalState.update('yescode.environment', env);

    const envName = env === 'production' ? vscode.l10n.t('Production') : vscode.l10n.t('Test');
    vscode.window.showInformationMessage(vscode.l10n.t('API Key saved successfully! ({0} Environment)', envName));
}

// ============================================================================
// User Path API Functions
// ============================================================================

export async function getAvailableProviders(context: vscode.ExtensionContext): Promise<AvailableProviderResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            vscode.window.showWarningMessage(vscode.l10n.t('YesCode API Key not set.'));
            return null;
        }

        const baseUrl = await getBaseUrl(context);
        const response = await fetch(`${baseUrl}/api/v1/user/available-providers`, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as AvailableProviderResponse;
    } catch (error) {
        console.error('Error fetching available providers:', error);
        vscode.window.showErrorMessage(vscode.l10n.t('Failed to fetch providers: {0}', error instanceof Error ? error.message : vscode.l10n.t('Unknown error')));
        return null;
    }
}

export async function getUserProviderAlternatives(context: vscode.ExtensionContext, providerId: number): Promise<ProviderAlternativesResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            return null;
        }

        const baseUrl = await getBaseUrl(context);
        const response = await fetch(`${baseUrl}/api/v1/user/provider-alternatives/${providerId}`, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return { data: [] };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as ProviderAlternativesResponse;
    } catch (error) {
        console.error('Error fetching provider alternatives:', error);
        vscode.window.showErrorMessage(vscode.l10n.t('Failed to fetch alternatives: {0}', error instanceof Error ? error.message : vscode.l10n.t('Unknown error')));
        return null;
    }
}

export async function getCurrentUserSelection(context: vscode.ExtensionContext, providerId: number): Promise<ProviderSelectionResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            return null;
        }

        const baseUrl = await getBaseUrl(context);
        const response = await fetch(`${baseUrl}/api/v1/user/provider-alternatives/${providerId}/selection`, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as ProviderSelectionResponse;
    } catch (error) {
        console.error('Error fetching current selection:', error);
        return null;
    }
}

export async function setUserSelection(context: vscode.ExtensionContext, providerId: number, alternativeId: number): Promise<ProviderSelectionResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            return null;
        }

        const baseUrl = await getBaseUrl(context);
        const response = await fetch(`${baseUrl}/api/v1/user/provider-alternatives/${providerId}/selection`, {
            method: 'PUT',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                selected_alternative_id: alternativeId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as ProviderSelectionResponse;
    } catch (error) {
        console.error('Error setting user selection:', error);
        vscode.window.showErrorMessage(vscode.l10n.t('Failed to update selection: {0}', error instanceof Error ? error.message : vscode.l10n.t('Unknown error')));
        return null;
    }
}

// ============================================================================
// Team Path API Functions
// ============================================================================

export async function getTeamProviderAlternatives(context: vscode.ExtensionContext, providerType: string): Promise<TeamProviderAlternativesResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            return null;
        }

        const baseUrl = await getBaseUrl(context);
        const response = await fetch(`${baseUrl}/api/v1/user/team-provider-alternatives/${providerType}`, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return { data: [], provider_type: providerType };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as TeamProviderAlternativesResponse;
    } catch (error) {
        console.error('Error fetching team provider alternatives:', error);
        return null;
    }
}

export async function getCurrentTeamSelection(context: vscode.ExtensionContext, providerType: string): Promise<TeamProviderSelectionResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            return null;
        }

        const baseUrl = await getBaseUrl(context);
        const response = await fetch(`${baseUrl}/api/v1/user/team-provider-alternatives/${providerType}/selection`, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return { data: null };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as TeamProviderSelectionResponse;
    } catch (error) {
        console.error('Error fetching current team selection:', error);
        return null;
    }
}

export async function setTeamSelection(context: vscode.ExtensionContext, providerType: string, providerId: number): Promise<TeamProviderSelectionResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            return null;
        }

        const baseUrl = await getBaseUrl(context);
        const response = await fetch(`${baseUrl}/api/v1/user/team-provider-alternatives/${providerType}/selection`, {
            method: 'PUT',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                selected_provider_id: providerId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as TeamProviderSelectionResponse;
    } catch (error) {
        console.error('Error setting team selection:', error);
        vscode.window.showErrorMessage(vscode.l10n.t('Failed to update team selection: {0}', error instanceof Error ? error.message : vscode.l10n.t('Unknown error')));
        return null;
    }
}

export async function resetTeamSelection(context: vscode.ExtensionContext, providerType: string): Promise<boolean> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            return false;
        }

        const baseUrl = await getBaseUrl(context);
        const response = await fetch(`${baseUrl}/api/v1/user/team-provider-alternatives/${providerType}/selection`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok && response.status !== 204) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error resetting team selection:', error);
        vscode.window.showErrorMessage(vscode.l10n.t('Failed to reset to team default: {0}', error instanceof Error ? error.message : vscode.l10n.t('Unknown error')));
        return false;
    }
}
