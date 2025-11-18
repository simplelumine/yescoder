export function generateCliSetupCommand(
    cli: 'gemini' | 'codex' | 'claude',
    os: 'windows' | 'unix',
    mode: 'team' | 'user',
    apiKey: string
): string {
    const baseUrl = 'https://co.yes.vg';

    // Build the command based on CLI, OS, and mode
    if (os === 'unix') {
        // Unix-based systems (Linux, macOS)
        if (mode === 'team') {
            return `curl -s ${baseUrl}/setup_${cli}.sh | bash -s -- --url ${baseUrl}/team/${cli} --key ${apiKey}`;
        } else {
            return `curl -s ${baseUrl}/setup_${cli}.sh | bash -s -- --key ${apiKey}`;
        }
    } else {
        // Windows
        if (mode === 'team') {
            return `powershell -Command "irm ${baseUrl}/setup_${cli}.ps1 | iex; Setup-${cli.charAt(0).toUpperCase() + cli.slice(1)} -Url '${baseUrl}/team/${cli}' -Key '${apiKey}'"`;
        } else {
            return `powershell -Command "irm ${baseUrl}/setup_${cli}.ps1 | iex; Setup-${cli.charAt(0).toUpperCase() + cli.slice(1)} -Key '${apiKey}'"`;
        }
    }
}
