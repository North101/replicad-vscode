export default ({ children }: React.PropsWithChildren) => {
  return <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2em',
      width: '100vw',
      height: '100vh',
      background: 'var(--vscode-editor-background)',
      color: 'var(--vscode-editor-foreground)',
    }}
  >
    {children}
  </div>
}
