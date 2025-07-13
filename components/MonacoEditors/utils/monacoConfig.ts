import type { Monaco } from '@monaco-editor/react'

/**
 * Configures Monaco Editor's TypeScript and JavaScript language services
 * Sets up compiler options and diagnostics for better error detection
 */
export const configureMonacoLanguageServices = (monaco: Monaco): void => {
  // Configure TypeScript compiler options
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    allowJs: true,
    checkJs: true,
  })

  // Configure JavaScript compiler options
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    allowJs: true,
    checkJs: true,
  })

  // Configure diagnostics options for TypeScript
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
  })

  // Configure diagnostics options for JavaScript
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
  })
}

/**
 * Default editor options for consistent configuration
 */
export const getDefaultEditorOptions = () => ({
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'on' as const,
  wrappingIndent: 'same' as const,
  lineNumbers: 'on' as const,
  renderLineHighlight: 'all' as const,
  cursorBlinking: 'blink' as const,
  cursorStyle: 'line' as const,
  roundedSelection: false,
  scrollbar: {
    vertical: 'visible' as const,
    horizontal: 'visible' as const,
  },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
})
