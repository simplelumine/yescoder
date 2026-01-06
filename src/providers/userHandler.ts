import * as vscode from 'vscode';
import {
    getUserProviderAlternatives,
    getCurrentUserSelection,
    setUserSelection
} from '../api';
import { ProviderMenuItem, AlternativeMenuItem } from './types';

export async function handleUserProviderSelection(context: vscode.ExtensionContext, provider: ProviderMenuItem): Promise<void> {
    if (!provider.providerId) {
        return;
    }

    // Fetch alternatives for this provider
    const alternatives = await getUserProviderAlternatives(context, provider.providerId);

    if (!alternatives || alternatives.data.length === 0) {
        // No alternatives available, just return silently
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
        vscode.window.showInformationMessage(vscode.l10n.t('This alternative is already selected.'));
        return;
    }

    // Check if alternativeId exists
    if (!selectedAlternative.alternativeId) {
        vscode.window.showErrorMessage(vscode.l10n.t('Invalid alternative selection.'));
        return;
    }

    // Set the new selection
    const result = await setUserSelection(context, provider.providerId, selectedAlternative.alternativeId);

    if (result) {
        vscode.window.showInformationMessage(
            vscode.l10n.t('Successfully switched {0} to {1}', provider.providerDisplayName || '', selectedAlternative.label.replace('$(check) ', ''))
        );
    } else {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Failed to switch provider. Please try again.')
        );
    }
}
