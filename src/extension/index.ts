import vscode from 'vscode'
import {
  createPanel,
  onDidChangeActiveTextEditor,
  onDidCloseTextDocument,
  onDidSaveTextDocument,
} from './panel'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(onDidSaveTextDocument),
    vscode.workspace.onDidCloseTextDocument(onDidCloseTextDocument),
    vscode.window.onDidChangeActiveTextEditor(onDidChangeActiveTextEditor),
    vscode.commands.registerTextEditorCommand(
      'replicad-vscode.preview',
      () => createPanel(context),
    ),
  )
}

// This method is called when your extension is deactivated
export function deactivate() { }
