import { Channel, invoke } from '@tauri-apps/api/core'

export type AnalyzeResult = Array<[number, number, number[] | null]>

export interface Probed {
  path: string
  numChannels: number
  sampleRate: number
  numFrames: number
}

export interface DecodeProgress {
  cur: number
}

export interface DetectProgress {
  cur: number
}

export interface Detected {
  num_clips: number
}

export interface ClassifyProgress {
  cur: number
}

export type AnalyzeEvent =
  | {
    event: 'probed'
    data: Probed
  }
  | {
    event: 'decodeProgress'
    data: DecodeProgress
  }
  | {
    event: 'decoded'
  }
  | {
    event: 'detectProgress'
    data: DetectProgress
  }
  | {
    event: 'detected'
    data: Detected
  }
  | {
    event: 'classifyProgress'
    data: ClassifyProgress
  }
  | {
    event: 'classified'
  }

export const analyze = async (
  path: string,
  batchSize: number,
  pcmThreshold: number,
  timeThreshold: number,
  enableClassify: boolean,
  onEvent: (event: AnalyzeEvent) => void
): Promise<AnalyzeResult> => {
  const chan = new Channel<AnalyzeEvent>()

  chan.onmessage = onEvent

  // The TypeScript compiler insists on a type annotation here, so we've added one.
  const doInvoke = async (): Promise<AnalyzeResult> => {
    return await invoke('analyze', {
      path,
      batchSize,
      pcmThreshold,
      timeThreshold,
      enableClassify,
      chan
    })
  }
  const res = await doInvoke()

  if (!enableClassify) {
    for (const c of res) {
      c[2] = null
    }
  }
  return res
}
