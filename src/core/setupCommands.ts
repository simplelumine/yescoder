/**
 * Supported CLI types
 */
export type CliType = 'gemini' | 'codex' | 'claude' | 'opencode' | 'droid';

/**
 * Generate CLI setup command
 */
export function generateCliSetupCommand(
    cli: CliType,
    os: 'windows' | 'unix',
    mode: 'team' | 'user',
    apiKey: string,
    baseUrl: string
): string {
    // Get script name based on CLI
    let scriptFileName: string;
    switch (cli) {
        case 'claude':
            scriptFileName = 'setup-claude-code';
            break;
        case 'codex':
            scriptFileName = 'setup-codex';
            break;
        case 'gemini':
            scriptFileName = 'setup_gemini';
            break;
        case 'opencode':
            scriptFileName = 'setup-opencode';
            break;
        case 'droid':
            scriptFileName = 'setup-droid';
            break;
    }

    // Determine URL based on CLI and mode
    let url: string;
    if (mode === 'team') {
        url = cli === 'gemini' ? `${baseUrl}/team/gemini` : `${baseUrl}/team`;
    } else {
        url = cli === 'gemini' ? `${baseUrl}/gemini` : baseUrl;
    }

    // Build the command based on OS
    if (os === 'unix') {
        // Unix-based systems (Linux, macOS)
        return `curl -s ${baseUrl}/${scriptFileName}.sh | bash -s -- --url ${url} --key ${apiKey}`;
    } else {
        // Windows PowerShell
        return `& { $base='${baseUrl}'; $url='${url}'; $key='${apiKey}'; iwr -useb $base/${scriptFileName}.ps1 | iex }`;
    }
}
