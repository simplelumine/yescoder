import * as vscode from 'vscode';
import { generateCliSetupCommand } from '../core/setupCommands';

interface UserMenuItem extends vscode.QuickPickItem {
    cli: 'gemini' | 'codex' | 'claude';
}

/**
 * Build user menu items
 * @param osLabel - The OS label (e.g., "PowerShell" or "Unix")
 */
export function buildUserMenuItems(osLabel: string): UserMenuItem[] {
    return [
        {
            label: '$(person) Claude Code',
            description: '',
            cli: 'claude',
            detail: `  └ Detected OS: ${osLabel}`
        },
        {
            label: '$(person) Codex CLI',
            description: '',
            cli: 'codex',
            detail: `  └ Detected OS: ${osLabel}`
        },
        {
            label: '$(person) Gemini CLI',
            description: '',
            cli: 'gemini',
            detail: `  └ Detected OS: ${osLabel}`
        }
    ];
}

/**
 * Handle user menu selection - with confirmation dialog
 */
export async function handleUserSelection(
    context: vscode.ExtensionContext,
    selectedCli: 'gemini' | 'codex' | 'claude',
    os: 'windows' | 'unix',
    apiKey: string,
    baseUrl: string
): Promise<void> {
    const cliName = selectedCli.charAt(0).toUpperCase() + selectedCli.slice(1);

    // Show confirmation dialog with options
    const choice = await vscode.window.showInformationMessage(
        `Setup ${cliName} CLI:`,
        { modal: true, detail: 'Choose how to proceed with the setup command.' },
        'Auto Execute',
        'Copy Command'
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

    if (choice === 'Auto Execute') {
        // Auto-execute in terminal without exposing key to clipboard
        const terminal = vscode.window.createTerminal(`${cliName} Setup`);
        terminal.show();
        terminal.sendText(command);

        vscode.window.showInformationMessage(
            `${cliName} setup is running in the terminal...`
        );
    } else if (choice === 'Copy Command') {
        // Copy to clipboard with warning
        await vscode.env.clipboard.writeText(command);

        vscode.window.showWarningMessage(
            `${cliName} setup command copied to clipboard.\n⚠️  Command contains API key, use with caution.`
        );
    }
}
