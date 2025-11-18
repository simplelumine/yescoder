import * as vscode from 'vscode';
import { fetchBalance } from '../api';
import { getTeamInfo, getOperatingSystem } from './utils';
import { generateCliSetupCommand } from './commands';

interface CliOption extends vscode.QuickPickItem {
    cli: 'gemini' | 'codex' | 'claude';
    mode: 'team' | 'user';
    isCustom?: boolean;
}

export async function showCliSetupMenu(context: vscode.ExtensionContext): Promise<void> {
    // Fetch user profile to check team status
    const profile = await fetchBalance(context);

    if (!profile) {
        vscode.window.showErrorMessage('Failed to fetch profile data. Please ensure your API key is set.');
        return;
    }

    // Get team information if available
    const teamInfo = getTeamInfo(profile);
    const apiKey = await context.secrets.get('yescode.apiKey');

    if (!apiKey) {
        vscode.window.showErrorMessage('API key not found. Please set your API key first.');
        return;
    }

    // Detect operating system
    const os = getOperatingSystem();
    const osLabel = os === 'windows' ? 'PowerShell' : 'Unix';
    const alternateOs = os === 'windows' ? 'unix' : 'windows';
    const alternateOsLabel = os === 'windows' ? 'Unix' : 'PowerShell';

    // Build menu items
    const menuItems: CliOption[] = [];

    // Add User section separator
    menuItems.push({
        label: 'User',
        description: '',
        cli: 'claude',
        mode: 'user',
        kind: vscode.QuickPickItemKind.Separator
    });

    // Add User options (Claude -> Codex -> Gemini)
    menuItems.push({
        label: '$(person) Claude Code',
        description: '',
        cli: 'claude',
        mode: 'user',
        detail: `  └ ${osLabel}`
    });
    menuItems.push({
        label: '$(person) Codex CLI',
        description: '',
        cli: 'codex',
        mode: 'user',
        detail: `  └ ${osLabel}`
    });
    menuItems.push({
        label: '$(person) Gemini CLI',
        description: '',
        cli: 'gemini',
        mode: 'user',
        detail: `  └ ${osLabel}`
    });

    // Add Team section if user is in a team
    if (teamInfo) {
        menuItems.push({
            label: 'Team',
            description: '',
            cli: 'claude',
            mode: 'team',
            kind: vscode.QuickPickItemKind.Separator
        });

        menuItems.push({
            label: '$(organization) Claude Code',
            description: 'TEAM',
            cli: 'claude',
            mode: 'team',
            detail: `  └ ${osLabel}`
        });
        menuItems.push({
            label: '$(organization) Codex CLI',
            description: 'TEAM',
            cli: 'codex',
            mode: 'team',
            detail: `  └ ${osLabel}`
        });
        menuItems.push({
            label: '$(organization) Gemini CLI',
            description: 'TEAM',
            cli: 'gemini',
            mode: 'team',
            detail: `  └ ${osLabel}`
        });
    }

    // Add Custom Setup option (for alternate OS)
    menuItems.push({
        label: `$(tools) ${alternateOsLabel} Setup`,
        description: 'Cross-platform',
        cli: 'claude',
        mode: 'user',
        detail: `  └ Get setup commands for ${alternateOsLabel}`,
        isCustom: true
    });

    // Create and configure QuickPick
    const quickPick = vscode.window.createQuickPick<CliOption>();
    quickPick.title = 'Configure CLI Environment';
    quickPick.placeholder = teamInfo
        ? 'Select a CLI setup option'
        : 'Select a CLI setup option';
    quickPick.items = menuItems;
    quickPick.matchOnDescription = true;

    quickPick.onDidAccept(async () => {
        const selected = quickPick.selectedItems[0];
        if (selected) {
            quickPick.hide();

            // Skip separators
            if (selected.kind === vscode.QuickPickItemKind.Separator) {
                return;
            }

            // Handle custom setup
            if (selected.isCustom) {
                await handleCustomSetup(context, apiKey, teamInfo, alternateOs, alternateOsLabel);
                return;
            }

            // Generate the appropriate command
            const command = generateCliSetupCommand(
                selected.cli,
                os,
                selected.mode,
                selected.mode === 'team' && teamInfo ? teamInfo.teamApiKey : apiKey
            );

            // Copy to clipboard
            await vscode.env.clipboard.writeText(command);

            // Show confirmation with action button
            const action = await vscode.window.showInformationMessage(
                `${selected.cli.charAt(0).toUpperCase() + selected.cli.slice(1)} setup command copied to clipboard!`,
                'Execute in Terminal'
            );

            // If user clicks the button, execute in terminal
            if (action === 'Execute in Terminal') {
                const terminal = vscode.window.createTerminal(`${selected.cli} Setup`);
                terminal.show();
                terminal.sendText(command);
            }
        }
    });

    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
}

async function handleCustomSetup(
    context: vscode.ExtensionContext,
    apiKey: string,
    teamInfo: { teamApiKey: string; teamName: string } | null,
    targetOs: 'windows' | 'unix',
    targetOsLabel: string
): Promise<void> {
    // Build menu for alternate OS
    const menuItems: vscode.QuickPickItem[] = [];

    // Add User section
    menuItems.push({
        label: 'User',
        kind: vscode.QuickPickItemKind.Separator
    });

    menuItems.push({
        label: '$(person) Claude Code',
        description: '',
        detail: `  └ ${targetOsLabel}`,
        picked: false
    });
    menuItems.push({
        label: '$(person) Codex CLI',
        description: '',
        detail: `  └ ${targetOsLabel}`,
        picked: false
    });
    menuItems.push({
        label: '$(person) Gemini CLI',
        description: '',
        detail: `  └ ${targetOsLabel}`,
        picked: false
    });

    // Add Team section if available
    if (teamInfo) {
        menuItems.push({
            label: 'Team',
            kind: vscode.QuickPickItemKind.Separator
        });

        menuItems.push({
            label: '$(organization) Claude Code',
            description: 'TEAM',
            detail: `  └ ${targetOsLabel}`,
            picked: false
        });
        menuItems.push({
            label: '$(organization) Codex CLI',
            description: 'TEAM',
            detail: `  └ ${targetOsLabel}`,
            picked: false
        });
        menuItems.push({
            label: '$(organization) Gemini CLI',
            description: 'TEAM',
            detail: `  └ ${targetOsLabel}`,
            picked: false
        });
    }

    const selected = await vscode.window.showQuickPick(menuItems, {
        placeHolder: `Select CLI setup for ${targetOsLabel}`,
        title: `${targetOsLabel} Setup`,
        ignoreFocusOut: true
    });

    if (!selected || selected.kind === vscode.QuickPickItemKind.Separator) {
        return;
    }

    // Parse selection
    const isTeam = selected.description === 'TEAM';
    const mode = isTeam ? 'team' : 'user';
    let cli: 'claude' | 'codex' | 'gemini';

    if (selected.label.includes('Claude')) {
        cli = 'claude';
    } else if (selected.label.includes('Codex')) {
        cli = 'codex';
    } else {
        cli = 'gemini';
    }

    // Generate the appropriate command
    const command = generateCliSetupCommand(
        cli,
        targetOs,
        mode,
        mode === 'team' && teamInfo ? teamInfo.teamApiKey : apiKey
    );

    // Copy to clipboard
    await vscode.env.clipboard.writeText(command);

    // Show confirmation with action button
    const action = await vscode.window.showInformationMessage(
        `${cli.charAt(0).toUpperCase() + cli.slice(1)} ${targetOsLabel} setup command copied to clipboard!`,
        'Execute in Terminal'
    );

    // If user clicks the button, execute in terminal
    if (action === 'Execute in Terminal') {
        const terminal = vscode.window.createTerminal(`${cli} Setup (${targetOsLabel})`);
        terminal.show();
        terminal.sendText(command);
    }
}
