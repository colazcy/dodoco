import { create } from 'zustand'
import createSelectors from './createSelectors'
import { Clip } from '@/utils'

type OnTimeUpdate = () => void

interface State {
  audio: HTMLAudioElement | null
  onTimeUpdate: OnTimeUpdate | null
  isPlaying: boolean
  playing: Clip | null
}

const defaultState: State = {
  audio: null,
  onTimeUpdate: null,
  isPlaying: false,
  playing: null
}

export const usePlayerStateStoreBase = create<State>(() => defaultState)

export const usePlayerStateStore = createSelectors(usePlayerStateStoreBase)
