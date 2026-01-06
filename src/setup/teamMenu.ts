import * as vscode from 'vscode';
import { generateCliSetupCommand } from '../core/setupCommands';

interface TeamMenuItem extends vscode.QuickPickItem {
    cli: 'gemini' | 'codex' | 'claude';
}

/**
 * Build team menu items
 * @param osLabel - The OS label (e.g., "PowerShell" or "Unix")
 */
export function buildTeamMenuItems(osLabel: string): TeamMenuItem[] {
    return [
        {
            label: `$(organization) ${vscode.l10n.t('Claude Code')}`,
            description: 'TEAM',
            cli: 'claude',
            detail: `  └ ${vscode.l10n.t('Current Session')}: ${osLabel}`
        },
        {
            label: `$(organization) ${vscode.l10n.t('Codex CLI')}`,
            description: 'TEAM',
            cli: 'codex',
            detail: `  └ ${vscode.l10n.t('Current Session')}: ${osLabel}`
        },
        {
            label: `$(organization) ${vscode.l10n.t('Gemini CLI')}`,
            description: 'TEAM',
            cli: 'gemini',
            detail: `  └ ${vscode.l10n.t('Current Session')}: ${osLabel}`
        }
    ];
}

/**
 * Handle team menu selection - with confirmation dialog
 */
export async function handleTeamSelection(
    context: vscode.ExtensionContext,
    selectedCli: 'gemini' | 'codex' | 'claude',
    os: 'windows' | 'unix',
    teamApiKey: string,
    baseUrl: string
): Promise<void> {
    const cliName = selectedCli.charAt(0).toUpperCase() + selectedCli.slice(1);

    // Show confirmation dialog with options
    const choice = await vscode.window.showInformationMessage(
        `Setup ${cliName} CLI for Team:`,
        { modal: true, detail: vscode.l10n.t('Choose how to proceed with the setup command.') },
        vscode.l10n.t('Run in Terminal'),
        vscode.l10n.t('Copy to Clipboard')
    );

    if (!choice) {
        return;
    }

    // Generate the appropriate command
    const command = generateCliSetupCommand(
        selectedCli,
        os,
        'team',
        teamApiKey,
        baseUrl
    );

    if (choice === vscode.l10n.t('Run in Terminal')) {
        // Auto-execute in terminal without exposing team key to clipboard
        const terminal = vscode.window.createTerminal(`${cliName} Team Setup`);
        terminal.show();
        terminal.sendText(command);

        vscode.window.showInformationMessage(
            `${cliName} team setup is running in the terminal...`
        );
    } else if (choice === vscode.l10n.t('Copy to Clipboard')) {
        // Copy to clipboard with warning
        await vscode.env.clipboard.writeText(command);

        vscode.window.showWarningMessage(
            vscode.l10n.t('The command has been copied to your clipboard!')
        );
    }
}
