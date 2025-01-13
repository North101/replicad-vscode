import path from 'path'
import vscode from 'vscode'
import { MessageTypes } from './types'

let panel: vscode.WebviewPanel | undefined

export function createPanel(context: vscode.ExtensionContext) {
  // Utilize method on vscode.window object to create webview
  panel = vscode.window.createWebviewPanel(
    'webview',
    'Preview Replicad Model',
    {
      viewColumn: vscode.ViewColumn.Beside,
      preserveFocus: true,
    },
    {
      enableScripts: true,
      enableFindWidget: true
    },
  )
  panel.onDidDispose(() => {
    panel = undefined
  })

  // Set URI to be the path to bundle
  const scriptPath: vscode.Uri = vscode.Uri.joinPath(context.extensionUri, 'build', 'webview.js')

  // Set webview URI to pass into html script
  const scriptUri: vscode.Uri = panel.webview.asWebviewUri(scriptPath)

  // Render html of webview here
  panel.webview.html = createWebviewHTML(scriptUri)
  panel.webview.onDidReceiveMessage(e => {
    const msg: MessageTypes = e
    switch (msg.type) {
      case 'init': {
        onDidChangeActiveTextEditor(vscode.window.activeTextEditor)
      }
    }
  })
}

export function onDidSaveTextDocument(document: vscode.TextDocument) {
  const editor = vscode.window.activeTextEditor
  if (editor?.document != document) return

  onDidChangeActiveTextEditor(editor)
}

export function onDidChangeActiveTextEditor(editor?: vscode.TextEditor) {
  const isJavascript = editor?.document.languageId == 'javascript'
  if (!isJavascript) return

  setPanelTitle(editor.document)
  sendPanelMessage({
    type: 'code',
    value: editor.document.getText(),
  })
}

function setPanelTitle(document: vscode.TextDocument) {
  if (!panel) return

  panel.title = `Preview ${path.basename(document.uri.fsPath)}`
}

function sendPanelMessage(msg: MessageTypes) {
  if (!panel) return

  panel.webview.postMessage(msg)
}

// Creates the HTML page for webview
function createWebviewHTML(scriptUri: vscode.Uri): string {
  return (`
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Replicad sample app</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="https://replicad.xyz/img/favicon.ico" />
    <link rel="stylesheet" href="https://unpkg.com/mvp.css">
  </head>
  <body>
    <div id="root" />
    <script>
        const vscode = acquireVsCodeApi()
        window.onload = function() {
          vscode.postMessage({
            type: 'init',
          })
        }
    </script>
    <script src="${scriptUri}" />
  </body>
</html>
`
  )
}
