import * as vscode from 'vscode';

export const outputChannel = vscode.window.createOutputChannel("Markdown Link Completion");
// outputChannel.show(false); // Display the channel by default
outputChannel.appendLine('Congratulations, your extension markdown link completion is now active!');


export function removeClosingBrackets(position: vscode.Position, line: vscode.TextLine) {
    const indexOfOpeningBrackets = line.text.lastIndexOf('[[', position.character);
    const indexOfClosingBrackets = line.text.indexOf(']]', position.character);

    let edits = [];

    if (indexOfOpeningBrackets !== -1) {
        let toDeleteCount = line.text[indexOfOpeningBrackets + 2] === '#' ? 3 : 2;
        const rangeToDeleteOpeningBrackets = new vscode.Range(
            line.range.start.with(undefined, indexOfOpeningBrackets),
            line.range.start.with(undefined, indexOfOpeningBrackets + toDeleteCount)
        );
        edits.push(vscode.TextEdit.delete(rangeToDeleteOpeningBrackets));
    }

    if (indexOfClosingBrackets !== -1) {
        const rangeToDeleteClosingBrackets = new vscode.Range(
            line.range.start.with(undefined, indexOfClosingBrackets),
            line.range.start.with(undefined, indexOfClosingBrackets + 2)
        );
        edits.push(vscode.TextEdit.delete(rangeToDeleteClosingBrackets));
    }

    return edits;
}

export function parseMarkdownHeaders(text: string) {
    const headerRegex = /^(#+)\s+(.*)$/gm;
    let headers = [];
    let match;
    while ((match = headerRegex.exec(text)) !== null) {
        headers.push(match[2]);
    }
    return headers;
}

export function replaceMarkdownLinkContent(editor: vscode.TextEditor, position: vscode.Position, mdLink: string, header: string) {
    editor.edit(editBuilder => {
        const matches = mdLink.match(/(\[[^\]]+\])/);

        if (matches && matches[1]) {
            const oldText = matches[1];
            const newText = `[${header}]`;

            const textBeforePosition = editor.document.getText(new vscode.Range(new vscode.Position(0, 0), position));
            const startPos = textBeforePosition.lastIndexOf(oldText);
            const endPos = startPos + oldText.length;

            if (startPos !== -1 && endPos !== -1) {
                const start = editor.document.positionAt(startPos);
                const end = editor.document.positionAt(endPos);
                const range = new vscode.Range(start, end);
                editBuilder.replace(range, newText);
            }
        }
    });
}