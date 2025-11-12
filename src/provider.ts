import * as vscode from 'vscode';
import {
    getAvailableProviders,
    getUserProviderAlternatives,
    getCurrentUserSelection,
    setUserSelection,
    getTeamProviderAlternatives,
    getCurrentTeamSelection,
    setTeamSelection,
    resetTeamSelection
} from './api';
import { ProviderInfo, TeamProviderAlternativesResponse, TeamProviderSelectionResponse } from './types';

interface ProviderMenuItem extends vscode.QuickPickItem {
    isTeam: boolean;
    providerId?: number;
    providerType?: string;
    providerDisplayName?: string;
}

interface AlternativeMenuItem extends vscode.QuickPickItem {
    alternativeId?: number;
    isCurrent: boolean;
    isDefaultReset?: boolean;
}

export async function showVendorSwitchMenu(context: vscode.ExtensionContext): Promise<void> {
    try {
        // Step 1: Fetch all data in parallel
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Loading provider data...",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0 });

            // First, get available providers to determine which team providers exist
            const availableProviders = await getAvailableProviders(context);

            if (!availableProviders) {
                vscode.window.showErrorMessage('Failed to fetch provider data.');
                return;
            }

            console.log('=== Debug: Available Providers ===');
            console.log('Total providers:', availableProviders.providers.length);
            availableProviders.providers.forEach((p, i) => {
                console.log(`[${i}] ${p.provider.display_name} - source: ${p.source}, type: ${p.provider.type}, id: ${p.provider.id}`);
            });

            // Separate providers by source
            const userPathProviders = availableProviders.providers.filter(
                p => p.source === 'subscription' || p.source === 'payg' || p.source === ''
            );
            const teamUserPathProviders = availableProviders.providers.filter(p => p.source === 'team');

            console.log('=== Debug: Provider Breakdown ===');
            console.log(`User Path Providers (sub/payg): ${userPathProviders.length}`);
            console.log(`Team Providers (User Path): ${teamUserPathProviders.length}`);
            teamUserPathProviders.forEach(p => {
                console.log(`  - ${p.provider.display_name} (ID: ${p.provider.id}, type: ${p.provider.type})`);
            });

            // Dynamically discover team provider types from available providers
            const teamProviderTypes = Array.from(new Set(
                availableProviders.providers
                    .filter(p => p.source === 'team')
                    .map(p => p.provider.type)
            ));

            console.log('=== Debug: Team Provider Types ===');
            console.log('Team types found:', teamProviderTypes);

            progress.report({ increment: 30 });

            // Always fetch team provider alternatives for all three types
            const allTeamTypes = ['claude', 'openai', 'google'];
            const teamProviderAlternativesMap = new Map<string, TeamProviderAlternativesResponse | null>();

            for (const type of allTeamTypes) {
                const alternatives = await getTeamProviderAlternatives(context, type);
                teamProviderAlternativesMap.set(type, alternatives);
            }

            console.log('=== Debug: Team Provider Alternatives (All Types) ===');
            for (const [type, alt] of teamProviderAlternativesMap.entries()) {
                console.log(`Type: ${type}, Alternatives count: ${alt?.data?.length || 0}`);
                if (alt && alt.data) {
                    alt.data.forEach((a, j) => {
                        console.log(`  [${j}] ${a.display_name} (id: ${a.alternative_provider_id})`);
                    });
                }
            }

            progress.report({ increment: 50 });

            // Fetch current selections for all providers
            const userProviderSelections = await Promise.all(
                availableProviders.providers.map(p => getCurrentUserSelection(context, p.provider.id))
            );

            // Fetch current selections for all team types
            const teamProviderSelectionsMap = new Map<string, TeamProviderSelectionResponse | null>();
            for (const type of allTeamTypes) {
                const selection = await getCurrentTeamSelection(context, type);
                teamProviderSelectionsMap.set(type, selection);
            }

            progress.report({ increment: 100 });

            // Step 2: Build the first Quick Pick menu
            const menuItems: ProviderMenuItem[] = [];

            // Add User-Level Providers section (subscription + payg)
            const userProviders = availableProviders.providers.filter(
                p => p.source === 'subscription' || p.source === 'payg' || p.source === ''
            );
            if (userProviders.length > 0) {
                menuItems.push({
                    label: 'User-Level Providers',
                    kind: vscode.QuickPickItemKind.Separator,
                    isTeam: false
                });

                // Iterate through filtered user providers
                for (const providerInfo of userProviders) {
                    // Find the corresponding selection by provider ID
                    const selection = userProviderSelections.find(
                        sel => sel?.data?.provider_id === providerInfo.provider.id
                    );

                    const currentProvider = selection?.data?.selected_alternative || providerInfo.provider;
                    const rateDisplay = (currentProvider.rate_multiplier * 100).toFixed(1);

                    menuItems.push({
                        label: `$(person) ${providerInfo.provider.display_name}`,
                        description: `${providerInfo.source.toUpperCase() || 'USER'}`,
                        detail: `  └ Currently: ${currentProvider.display_name} (${rateDisplay}% rate)`,
                        isTeam: false,
                        providerId: providerInfo.provider.id,
                        providerDisplayName: providerInfo.provider.display_name
                    });
                }
            }

            // Add Team Providers (User Path) - these have provider IDs
            const teamProvidersUserPath = availableProviders.providers.filter(p => p.source === 'team');
            if (teamProvidersUserPath.length > 0) {
                menuItems.push({
                    label: 'Team Providers (User Path)',
                    kind: vscode.QuickPickItemKind.Separator,
                    isTeam: false
                });

                for (const providerInfo of teamProvidersUserPath) {
                    // Find the corresponding selection by provider ID
                    const selection = userProviderSelections.find(
                        sel => sel?.data?.provider_id === providerInfo.provider.id
                    );

                    const currentProvider = selection?.data?.selected_alternative || providerInfo.provider;
                    const rateDisplay = (currentProvider.rate_multiplier * 100).toFixed(1);

                    menuItems.push({
                        label: `$(organization) ${providerInfo.provider.display_name}`,
                        description: 'TEAM (User Path)',
                        detail: `  └ Currently: ${currentProvider.display_name} (${rateDisplay}% rate)`,
                        isTeam: false,  // Use user path API
                        providerId: providerInfo.provider.id,
                        providerDisplayName: providerInfo.provider.display_name
                    });
                }
            }

            // Add Team-Level Providers section
            // Always show claude, openai, google team providers
            const teamSection: ProviderMenuItem[] = [];

            for (const providerType of allTeamTypes) {
                const alternatives = teamProviderAlternativesMap.get(providerType);
                const selection = teamProviderSelectionsMap.get(providerType);

                const displayName = providerType.charAt(0).toUpperCase() + providerType.slice(1);

                // Check if this type exists in available providers
                const hasTeamProvider = availableProviders.providers.some(
                    p => p.source === 'team' && p.provider.type === providerType
                );

                if (!hasTeamProvider) {
                    // Skip if not available in team
                    continue;
                }

                // Check if using team default (data is null) or no alternatives
                const hasNoAlternatives = !alternatives || alternatives.data.length === 0;
                const isUsingDefault = !selection?.data;

                if (hasNoAlternatives) {
                    // Show as "Use Team Default" (no other options)
                    teamSection.push({
                        label: `$(organization) ${displayName}`,
                        description: 'TEAM',
                        detail: `  └ Currently: Use Team Default (No alternatives available)`,
                        isTeam: true,
                        providerType: providerType,
                        providerDisplayName: displayName
                    });
                } else if (isUsingDefault) {
                    teamSection.push({
                        label: `$(organization) ${displayName}`,
                        description: 'TEAM',
                        detail: `  └ Currently: Use Team Default`,
                        isTeam: true,
                        providerType: providerType,
                        providerDisplayName: displayName
                    });
                } else {
                    const currentProvider = selection!.data!.selected_provider;
                    const rateDisplay = (currentProvider.rate_multiplier * 100).toFixed(1);

                    teamSection.push({
                        label: `$(organization) ${displayName}`,
                        description: 'TEAM',
                        detail: `  └ Currently: ${currentProvider.display_name} (${rateDisplay}% rate)`,
                        isTeam: true,
                        providerType: providerType,
                        providerDisplayName: displayName
                    });
                }
            }

            if (teamSection.length > 0) {
                menuItems.push({
                    label: 'Team Providers (Team Path)',
                    kind: vscode.QuickPickItemKind.Separator,
                    isTeam: false
                });
                menuItems.push(...teamSection);
            }

            if (menuItems.length === 0) {
                vscode.window.showInformationMessage('No providers available to switch.');
                return;
            }

            // Step 3: Show the first menu and handle selection
            const selectedProvider = await vscode.window.showQuickPick(menuItems, {
                placeHolder: 'Select a provider to switch',
                ignoreFocusOut: true
            });

            if (!selectedProvider || selectedProvider.kind === vscode.QuickPickItemKind.Separator) {
                return;
            }

            // Step 4: Handle the selection based on path
            if (selectedProvider.isTeam) {
                await handleTeamProviderSelection(context, selectedProvider);
            } else {
                await handleUserProviderSelection(context, selectedProvider);
            }
        });
    } catch (error) {
        console.error('Error in showVendorSwitchMenu:', error);
        vscode.window.showErrorMessage(`Failed to switch vendor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function handleUserProviderSelection(context: vscode.ExtensionContext, provider: ProviderMenuItem): Promise<void> {
    if (!provider.providerId) {
        return;
    }

    // Fetch alternatives for this provider
    const alternatives = await getUserProviderAlternatives(context, provider.providerId);

    if (!alternatives || alternatives.data.length === 0) {
        vscode.window.showInformationMessage(`No alternatives available for ${provider.providerDisplayName}.`);
        return;
    }

    // Get current selection
    const currentSelection = await getCurrentUserSelection(context, provider.providerId);
    const currentAlternativeId = currentSelection?.data?.selected_alternative_id;

    // Build alternatives menu
    const alternativeItems: AlternativeMenuItem[] = alternatives.data.map(alt => {
        const isCurrent = alt.alternative_id === currentAlternativeId;
        const rateDisplay = (alt.alternative.rate_multiplier * 100).toFixed(1);

        return {
            label: `${isCurrent ? '$(check) ' : ''}${alt.display_name}`,
            description: `${rateDisplay}% rate`,
            detail: alt.alternative.description || undefined,
            alternativeId: alt.alternative_id,
            isCurrent
        };
    });

    // Show alternatives menu
    const selectedAlternative = await vscode.window.showQuickPick(alternativeItems, {
        placeHolder: `Select an alternative for ${provider.providerDisplayName}`,
        ignoreFocusOut: true
    });

    if (!selectedAlternative) {
        return;
    }

    // Don't switch if already selected
    if (selectedAlternative.isCurrent) {
        vscode.window.showInformationMessage('This alternative is already selected.');
        return;
    }

    // Check if alternativeId exists
    if (!selectedAlternative.alternativeId) {
        vscode.window.showErrorMessage('Invalid alternative selection.');
        return;
    }

    // Set the new selection
    const result = await setUserSelection(context, provider.providerId, selectedAlternative.alternativeId);

    if (result) {
        vscode.window.showInformationMessage(
            `Successfully switched ${provider.providerDisplayName} to ${selectedAlternative.label.replace('$(check) ', '')}`
        );
    } else {
        vscode.window.showErrorMessage(
            `Failed to switch ${provider.providerDisplayName}. Please try again.`
        );
    }
}

async function handleTeamProviderSelection(context: vscode.ExtensionContext, provider: ProviderMenuItem): Promise<void> {
    if (!provider.providerType) {
        return;
    }

    // Fetch alternatives for this team provider
    const alternatives = await getTeamProviderAlternatives(context, provider.providerType);

    if (!alternatives || alternatives.data.length === 0) {
        vscode.window.showInformationMessage(
            `${provider.providerDisplayName} is currently using team default settings. ` +
            `No alternative providers are available for switching.`
        );
        return;
    }

    // Get current selection
    const currentSelection = await getCurrentTeamSelection(context, provider.providerType);
    const currentProviderId = currentSelection?.data?.selected_provider_id;
    const isUsingDefault = !currentSelection?.data;

    // Build alternatives menu
    const alternativeItems: AlternativeMenuItem[] = [];

    // Add "Use Team Default" option at the top
    alternativeItems.push({
        label: `${isUsingDefault ? '$(check) ' : ''}$(trash) Use Team Default`,
        description: 'Reset to team settings',
        isCurrent: isUsingDefault,
        isDefaultReset: true
    });

    // Add all other alternatives
    alternatives.data.forEach(alt => {
        const isCurrent = alt.alternative_provider_id === currentProviderId;
        const rateDisplay = (alt.alternative_provider.rate_multiplier * 100).toFixed(1);

        alternativeItems.push({
            label: `${isCurrent ? '$(check) ' : ''}${alt.display_name}`,
            description: `${rateDisplay}% rate`,
            detail: alt.alternative_provider.description || undefined,
            alternativeId: alt.alternative_provider_id,
            isCurrent
        });
    });

    // Show alternatives menu
    const selectedAlternative = await vscode.window.showQuickPick(alternativeItems, {
        placeHolder: `Select an alternative for ${provider.providerDisplayName}`,
        ignoreFocusOut: true
    });

    if (!selectedAlternative) {
        return;
    }

    // Don't switch if already selected
    if (selectedAlternative.isCurrent) {
        vscode.window.showInformationMessage('This option is already active.');
        return;
    }

    // Handle selection based on whether it's the default reset option
    if (selectedAlternative.isDefaultReset) {
        // Reset to team default using DELETE
        const success = await resetTeamSelection(context, provider.providerType);
        if (success) {
            vscode.window.showInformationMessage(
                `Successfully reset ${provider.providerDisplayName} to use team default`
            );
        } else {
            vscode.window.showErrorMessage(
                `Failed to reset ${provider.providerDisplayName}. Please try again.`
            );
        }
    } else if (selectedAlternative.alternativeId) {
        // Set the new selection using PUT
        const result = await setTeamSelection(context, provider.providerType, selectedAlternative.alternativeId);
        if (result) {
            vscode.window.showInformationMessage(
                `Successfully switched ${provider.providerDisplayName} to ${selectedAlternative.label.replace(/\$\(check\)\s*/, '')}`
            );
        } else {
            vscode.window.showErrorMessage(
                `Failed to switch ${provider.providerDisplayName}. Please try again.`
            );
        }
    } else {
        vscode.window.showErrorMessage('Invalid alternative selection.');
    }
}
