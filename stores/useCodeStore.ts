import { create } from 'zustand'

interface CodeState {
  code: string
  language: 'javascript' | 'typescript'
  setCode: (code: string) => void
  setLanguage: (lang: CodeState['language']) => void
}

export const useCodeStore = create<CodeState>((set) => ({
  code: '',
  language: 'javascript',
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
}))
