import * as vscode from 'vscode';
import {
    ProfileResponse,
    AvailableProviderResponse,
    ProviderAlternativesResponse,
    ProviderSelectionResponse,
    TeamProviderAlternativesResponse,
    TeamProviderSelectionResponse
} from './types';

export async function fetchBalance(context: vscode.ExtensionContext): Promise<ProfileResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');

        if (!apiKey) {
            vscode.window.showWarningMessage(
                'YesCode API Key not set. Please run "YesCode: Set API Key" command.',
                'Set API Key'
            ).then(selection => {
                if (selection === 'Set API Key') {
                    vscode.commands.executeCommand('yescode.setApiKey');
                }
            });
            return null;
        }

        const response = await fetch('https://co.yes.vg/api/v1/auth/profile', {
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
    } catch (error) {
        console.error('Error fetching balance:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to fetch YesCode balance: ${errorMessage}`);
        return null;
    }
}

export async function setApiKey(context: vscode.ExtensionContext): Promise<void> {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your YesCode API Key',
        password: true,
        ignoreFocusOut: true,
        placeHolder: 'Your API key will be stored securely'
    });

    if (apiKey) {
        await context.secrets.store('yescode.apiKey', apiKey);
        vscode.window.showInformationMessage('API Key saved securely!');
    } else {
        vscode.window.showWarningMessage('API Key not saved');
    }
}

// ============================================================================
// User Path API Functions
// ============================================================================

export async function getAvailableProviders(context: vscode.ExtensionContext): Promise<AvailableProviderResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            vscode.window.showWarningMessage('YesCode API Key not set.');
            return null;
        }

        const response = await fetch('https://co.yes.vg/api/v1/user/available-providers', {
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
        vscode.window.showErrorMessage(`Failed to fetch providers: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
    }
}

export async function getUserProviderAlternatives(context: vscode.ExtensionContext, providerId: number): Promise<ProviderAlternativesResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            return null;
        }

        const response = await fetch(`https://co.yes.vg/api/v1/user/provider-alternatives/${providerId}`, {
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
        vscode.window.showErrorMessage(`Failed to fetch alternatives: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
    }
}

export async function getCurrentUserSelection(context: vscode.ExtensionContext, providerId: number): Promise<ProviderSelectionResponse | null> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            return null;
        }

        const response = await fetch(`https://co.yes.vg/api/v1/user/provider-alternatives/${providerId}/selection`, {
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

        const response = await fetch(`https://co.yes.vg/api/v1/user/provider-alternatives/${providerId}/selection`, {
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
        vscode.window.showErrorMessage(`Failed to update selection: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

        const response = await fetch(`https://co.yes.vg/api/v1/user/team-provider-alternatives/${providerType}`, {
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

        const response = await fetch(`https://co.yes.vg/api/v1/user/team-provider-alternatives/${providerType}/selection`, {
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

        const response = await fetch(`https://co.yes.vg/api/v1/user/team-provider-alternatives/${providerType}/selection`, {
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
        vscode.window.showErrorMessage(`Failed to update team selection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
    }
}

export async function resetTeamSelection(context: vscode.ExtensionContext, providerType: string): Promise<boolean> {
    try {
        const apiKey = await context.secrets.get('yescode.apiKey');
        if (!apiKey) {
            return false;
        }

        const response = await fetch(`https://co.yes.vg/api/v1/user/team-provider-alternatives/${providerType}/selection`, {
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
        vscode.window.showErrorMessage(`Failed to reset to team default: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}
