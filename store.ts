import { create } from 'zustand';
import { DEFAULT_SCENARIO, BULL_CASE_PRESET, BEAR_CASE_PRESET, DEFAULT_SAAS_SCENARIO } from './constants';
import { ScenarioInput, ModelOutput, AppMode, WebSaasScenario } from './types';
import { calculateModel } from './utils/calculations';
import { calculateSaasModel } from './utils/saasCalculations';

interface AppState {
  mode: AppMode;
  
  // Mobile State
  scenarios: ScenarioInput[];
  activeScenarioId: string;
  
  // SaaS State
  saasScenarios: WebSaasScenario[];
  activeSaasScenarioId: string;

  results: ModelOutput;
  activeTacticsSection: string | null;
  
  // Actions
  setMode: (mode: AppMode) => void;
  
  // Mobile Actions
  addScenario: (base: Partial<ScenarioInput>) => void;
  switchScenario: (id: string) => void;
  updateScenario: (partial: Partial<ScenarioInput>) => void;
  updateNestedScenario: <K extends keyof ScenarioInput>(
    section: K, 
    data: Partial<ScenarioInput[K]>
  ) => void;
  deleteScenario: (id: string) => void;

  // SaaS Actions
  updateSaasScenario: (partial: Partial<WebSaasScenario>) => void;
  updateNestedSaasScenario: <K extends keyof WebSaasScenario>(
    section: K, 
    data: Partial<WebSaasScenario[K]>
  ) => void;

  openTactics: (section: string) => void;
  closeTactics: () => void;
}

export const useStore = create<AppState>((set, get) => {
  // Init Mobile
  const defaultScenario = { ...DEFAULT_SCENARIO, id: 'base' };
  const initialResultsMobile = calculateModel(defaultScenario);

  // Init SaaS
  const defaultSaas = { ...DEFAULT_SAAS_SCENARIO, id: 'saas-base' };

  return {
    mode: 'mobile',
    
    scenarios: [defaultScenario],
    activeScenarioId: 'base',
    
    saasScenarios: [defaultSaas],
    activeSaasScenarioId: 'saas-base',

    results: initialResultsMobile,
    activeTacticsSection: null,

    setMode: (mode) => {
      set((state) => {
        if (mode === 'mobile') {
          const active = state.scenarios.find(s => s.id === state.activeScenarioId) || state.scenarios[0];
          return { mode, results: calculateModel(active) };
        } else {
          const active = state.saasScenarios.find(s => s.id === state.activeSaasScenarioId) || state.saasScenarios[0];
          return { mode, results: calculateSaasModel(active) };
        }
      });
    },

    // --- Mobile Actions ---

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

    // --- SaaS Actions ---

    updateSaasScenario: (partial) => {
      set((state) => {
        const updatedScenarios = state.saasScenarios.map(s => 
            s.id === state.activeSaasScenarioId ? { ...s, ...partial } : s
        );
        const active = updatedScenarios.find(s => s.id === state.activeSaasScenarioId)!;
        return {
            saasScenarios: updatedScenarios,
            results: calculateSaasModel(active)
        };
      });
    },

    updateNestedSaasScenario: (section, data) => {
      set((state) => {
        const active = state.saasScenarios.find(s => s.id === state.activeSaasScenarioId)!;
        // @ts-ignore - dynamic key access hard to type strictly without boilerplate
        const updatedScenario = {
            ...active,
            [section]: {
                ...active[section],
                ...data
            }
        };
        const updatedScenarios = state.saasScenarios.map(s => 
            s.id === state.activeSaasScenarioId ? updatedScenario : s
        );
        return {
            saasScenarios: updatedScenarios,
            results: calculateSaasModel(updatedScenario)
        };
      });
    },

    openTactics: (section) => set({ activeTacticsSection: section }),
    closeTactics: () => set({ activeTacticsSection: null }),
  };
});