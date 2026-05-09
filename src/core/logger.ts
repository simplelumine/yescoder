import * as vscode from 'vscode';

class Logger {
    private channel: vscode.OutputChannel;

    constructor() {
        this.channel = vscode.window.createOutputChannel('YesCoder');
    }

    public log(message: string): void {
        const timestamp = new Date().toISOString();
        this.channel.appendLine(`[${timestamp}] [INFO] ${message}`);
        console.log(`[YesCoder] ${message}`);
    }

    public error(message: string, error?: any): void {
        const timestamp = new Date().toISOString();
        const errDetails = error instanceof Error ? error.stack : JSON.stringify(error);
        this.channel.appendLine(`[${timestamp}] [ERROR] ${message} ${errDetails ? `\nDetails: ${errDetails}` : ''}`);
        console.error(`[YesCoder] ${message}`, error);
    }

    public debug(message: string): void {
        const timestamp = new Date().toISOString();
        this.channel.appendLine(`[${timestamp}] [DEBUG] ${message}`);
        console.debug(`[YesCoder] ${message}`);
    }

    public show(): void {
        this.channel.show();
    }
}

export const logger = new Logger();
