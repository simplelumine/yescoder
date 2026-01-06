import * as vscode from 'vscode';
import { generateCliSetupCommand, CliType } from '../core/setupCommands';

interface UserMenuItem extends vscode.QuickPickItem {
    cli: CliType;
}

/**
 * Build user menu items
 * @param osLabel - The OS label (e.g., "PowerShell" or "Unix")
 */
export function buildUserMenuItems(osLabel: string): UserMenuItem[] {
    return [
        {
            label: `$(person) ${vscode.l10n.t('Claude Code')}`,
            description: '',
            cli: 'claude',
            detail: `  └ ${vscode.l10n.t('Current Session')}: ${osLabel}`
        },
        {
            label: `$(person) ${vscode.l10n.t('Codex CLI')}`,
            description: '',
            cli: 'codex',
            detail: `  └ ${vscode.l10n.t('Current Session')}: ${osLabel}`
        },
        {
            label: `$(person) ${vscode.l10n.t('Gemini CLI')}`,
            description: '',
            cli: 'gemini',
            detail: `  └ ${vscode.l10n.t('Current Session')}: ${osLabel}`
        },
        {
            label: `$(person) ${vscode.l10n.t('OpenCode')}`,
            description: '',
            cli: 'opencode',
            detail: `  └ ${vscode.l10n.t('Current Session')}: ${osLabel}`
        },
        {
            label: `$(person) ${vscode.l10n.t('Droid')}`,
            description: '',
            cli: 'droid',
            detail: `  └ ${vscode.l10n.t('Current Session')}: ${osLabel}`
        }
    ];
}

/**
 * Handle user menu selection - with confirmation dialog
 */
export async function handleUserSelection(
    context: vscode.ExtensionContext,
    selectedCli: CliType,
    os: 'windows' | 'unix',
    apiKey: string,
    baseUrl: string
): Promise<void> {
    const cliName = selectedCli.charAt(0).toUpperCase() + selectedCli.slice(1);

    // Show confirmation dialog with options
    const choice = await vscode.window.showInformationMessage(
        `Setup ${cliName} CLI:`,
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
        'user',
        apiKey,
        baseUrl
    );

    if (choice === vscode.l10n.t('Run in Terminal')) {
        // Auto-execute in terminal without exposing key to clipboard
        const terminal = vscode.window.createTerminal(`${cliName} Setup`);
        terminal.show();
        terminal.sendText(command);

        vscode.window.showInformationMessage(
            `${cliName} setup is running in the terminal...`
        );
    } else if (choice === vscode.l10n.t('Copy to Clipboard')) {
        // Copy to clipboard with warning
        await vscode.env.clipboard.writeText(command);

        vscode.window.showWarningMessage(
            vscode.l10n.t('The command has been copied to your clipboard!')
        );
    }
}
