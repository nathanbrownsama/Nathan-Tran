import { create } from 'zustand';
import { DEFAULT_SCENARIO, BULL_CASE_PRESET, BEAR_CASE_PRESET } from './constants';
import { ScenarioInput, ModelOutput } from './types';
import { calculateModel } from './utils/calculations';

interface AppState {
  scenarios: ScenarioInput[];
  activeScenarioId: string;
  results: ModelOutput;
  activeTacticsSection: string | null;
  
  // Actions
  addScenario: (base: Partial<ScenarioInput>) => void;
  switchScenario: (id: string) => void;
  updateScenario: (partial: Partial<ScenarioInput>) => void;
  updateNestedScenario: <K extends keyof ScenarioInput>(
    section: K, 
    data: Partial<ScenarioInput[K]>
  ) => void;
  deleteScenario: (id: string) => void;
  openTactics: (section: string) => void;
  closeTactics: () => void;
}

export const useStore = create<AppState>((set, get) => {
  // Init with default
  const defaultScenario = { ...DEFAULT_SCENARIO, id: 'base' };
  const initialResults = calculateModel(defaultScenario);

  return {
    scenarios: [defaultScenario],
    activeScenarioId: 'base',
    results: initialResults,
    activeTacticsSection: null,

    addScenario: (base) => {
      set((state) => {
        const newId = `scenario-${Date.now()}`;
        const newScenario = { 
          ...state.scenarios.find(s => s.id === state.activeScenarioId)!, 
          ...base, 
          id: newId,
          name: base.name || 'New Scenario'
        };
        return {
          scenarios: [...state.scenarios, newScenario],
          activeScenarioId: newId,
          results: calculateModel(newScenario)
        };
      });
    },

    switchScenario: (id) => {
      set((state) => {
        const target = state.scenarios.find(s => s.id === id);
        if (!target) return {};
        return {
          activeScenarioId: id,
          results: calculateModel(target)
        };
      });
    },

    updateScenario: (partial) => {
      set((state) => {
        const updatedScenarios = state.scenarios.map(s => 
          s.id === state.activeScenarioId ? { ...s, ...partial } : s
        );
        const active = updatedScenarios.find(s => s.id === state.activeScenarioId)!;
        return {
          scenarios: updatedScenarios,
          results: calculateModel(active)
        };
      });
    },

    updateNestedScenario: (section, data) => {
      set((state) => {
        const active = state.scenarios.find(s => s.id === state.activeScenarioId)!;
        const updatedScenario = {
          ...active,
          [section]: {
            ...active[section],
            ...data
          }
        };
        
        const updatedScenarios = state.scenarios.map(s => 
          s.id === state.activeScenarioId ? updatedScenario : s
        );

        return {
          scenarios: updatedScenarios,
          results: calculateModel(updatedScenario)
        };
      });
    },
    
    deleteScenario: (id) => {
      set((state) => {
        if (state.scenarios.length <= 1) return {};
        const newScenarios = state.scenarios.filter(s => s.id !== id);
        const newActive = newScenarios[0];
        return {
          scenarios: newScenarios,
          activeScenarioId: newActive.id,
          results: calculateModel(newActive)
        }
      });
    },

    openTactics: (section) => set({ activeTacticsSection: section }),
    closeTactics: () => set({ activeTacticsSection: null }),
  };
});