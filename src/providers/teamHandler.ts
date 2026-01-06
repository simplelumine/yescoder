import * as vscode from 'vscode';
import {
    getTeamProviderAlternatives,
    getCurrentTeamSelection,
    setTeamSelection,
    resetTeamSelection
} from '../api';
import { ProviderMenuItem, AlternativeMenuItem } from './types';

export async function handleTeamProviderSelection(context: vscode.ExtensionContext, provider: ProviderMenuItem): Promise<void> {
    if (!provider.providerType) {
        return;
    }

    // Fetch alternatives for this team provider
    const alternatives = await getTeamProviderAlternatives(context, provider.providerType);

    // Get current selection
    const currentSelection = await getCurrentTeamSelection(context, provider.providerType);
    const currentProviderId = currentSelection?.data?.selected_provider_id;
    const isUsingDefault = !currentSelection?.data;

    // Build alternatives menu
    const alternativeItems: AlternativeMenuItem[] = [];

    // Add "Use Team Default" option at the top
    alternativeItems.push({
        label: `${isUsingDefault ? '$(check) ' : ''}Use Team Default`,
        description: 'Reset to team settings',
        isCurrent: isUsingDefault,
        isDefaultReset: true
    });

    // Add all other alternatives (if any)
    if (alternatives && alternatives.data.length > 0) {
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
    }

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
        vscode.window.showInformationMessage(vscode.l10n.t('This option is already active.'));
        return;
    }

    // Handle selection based on whether it's the default reset option
    if (selectedAlternative.isDefaultReset) {
        // Reset to team default using DELETE
        const success = await resetTeamSelection(context, provider.providerType);
        if (success) {
            vscode.window.showInformationMessage(
                vscode.l10n.t('Successfully reset to team default for {0}', provider.providerDisplayName || '')
            );
        } else {
            vscode.window.showErrorMessage(
                vscode.l10n.t('Failed to reset to team default. Please try again.')
            );
        }
    } else if (selectedAlternative.alternativeId) {
        // Set the new selection using PUT
        const result = await setTeamSelection(context, provider.providerType, selectedAlternative.alternativeId);
        if (result) {
            vscode.window.showInformationMessage(
                vscode.l10n.t('Successfully switched {0} to {1}', provider.providerDisplayName || '', selectedAlternative.label.replace(/\$\(check\)\s*/, ''))
            );
        } else {
            vscode.window.showErrorMessage(
                vscode.l10n.t('Failed to switch provider. Please try again.')
            );
        }
    } else {
        vscode.window.showErrorMessage(vscode.l10n.t('Invalid alternative selection.'));
    }
}
