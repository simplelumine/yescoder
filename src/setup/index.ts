import * as vscode from 'vscode';
import { fetchBalance } from '../api';
import { getTeamInfo, getOperatingSystem } from './utils';
import { generateCliSetupCommand } from './commands';

interface CliOption {
    label: string;
    description: string;
    cli: 'gemini' | 'codex' | 'claude';
    mode: 'team' | 'user';
    detail?: string;
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

    // Build menu items
    const menuItems: CliOption[] = [];

    // Add team options if user is in a team
    if (teamInfo) {
        menuItems.push(
            {
                label: '$(rocket) Gemini Team Setup',
                description: `Configure Gemini CLI for ${teamInfo.teamName}`,
                cli: 'gemini',
                mode: 'team',
                detail: 'Recommended for team members'
            },
            {
                label: '$(rocket) Codex Team Setup',
                description: `Configure Codex CLI for ${teamInfo.teamName}`,
                cli: 'codex',
                mode: 'team',
                detail: 'Recommended for team members'
            },
            {
                label: '$(rocket) Claude Team Setup',
                description: `Configure Claude CLI for ${teamInfo.teamName}`,
                cli: 'claude',
                mode: 'team',
                detail: 'Recommended for team members'
            }
        );
    }

    // Add standard user options
    menuItems.push(
        {
            label: '$(person) Gemini User Setup',
            description: 'Configure Gemini CLI for personal use',
            cli: 'gemini',
            mode: 'user',
            detail: teamInfo ? undefined : 'Standard setup'
        },
        {
            label: '$(person) Codex User Setup',
            description: 'Configure Codex CLI for personal use',
            cli: 'codex',
            mode: 'user',
            detail: teamInfo ? undefined : 'Standard setup'
        },
        {
            label: '$(person) Claude User Setup',
            description: 'Configure Claude CLI for personal use',
            cli: 'claude',
            mode: 'user',
            detail: teamInfo ? undefined : 'Standard setup'
        }
    );

    // Create and configure QuickPick
    const quickPick = vscode.window.createQuickPick<CliOption>();
    quickPick.title = 'Configure CLI Environment';
    quickPick.placeholder = teamInfo
        ? 'Select a CLI setup option (Team setups recommended)'
        : 'Select a CLI setup option';
    quickPick.items = menuItems;
    quickPick.matchOnDescription = true;

    quickPick.onDidAccept(async () => {
        const selected = quickPick.selectedItems[0];
        if (selected) {
            quickPick.hide();

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
