import { create } from 'zustand'

interface SearchStore {
  selectedSport: string | null
  setSelectedSport: (sport: string) => void
}

export const useSearchStore = create<SearchStore>((set) => ({
  selectedSport: null,
  setSelectedSport: (sport) => set({ selectedSport: sport }),
}))