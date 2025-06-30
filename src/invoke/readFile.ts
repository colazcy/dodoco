import { invoke } from '@tauri-apps/api/core'

export const readFile = async (path: string): Promise<ArrayBuffer> => {
  return await invoke('read_file', {
    path
  })
}
