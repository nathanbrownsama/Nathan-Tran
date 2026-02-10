import { create } from 'zustand';
import { DEFAULT_SCENARIO, DEFAULT_SAAS_SCENARIO } from './constants';
import { ScenarioInput, ModelOutput, AppMode, WebSaasScenario } from './types';
import { calculateModel } from './utils/calculations';
import { calculateSaasModel } from './utils/saasCalculations';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface UserState {
  uid: string | null;
  email: string | null;
  photoURL: string | null;
  loading: boolean;
}

interface AppState {
  // User & Auth
  user: UserState;
  setUser: (user: Partial<UserState>) => void;
  
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

  // Persistence
  loadUserData: (uid: string) => Promise<void>;
}

// Debounce helper for Firestore writes
let saveTimeout: NodeJS.Timeout;
const debouncedSave = (uid: string, data: any) => {
  if (!uid) return;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await setDoc(doc(db, 'users', uid), data, { merge: true });
      console.log('Saved to Firestore');
    } catch (e) {
      console.error('Error saving to Firestore', e);
    }
  }, 1500); // Save after 1.5s of inactivity
};

export const useStore = create<AppState>((set, get) => {
  // Init Mobile
  const defaultScenario = { ...DEFAULT_SCENARIO, id: 'base' };
  const initialResultsMobile = calculateModel(defaultScenario);

  // Init SaaS
  const defaultSaas = { ...DEFAULT_SAAS_SCENARIO, id: 'saas-base' };

  return {
    user: { uid: null, email: null, photoURL: null, loading: true },
    
    setUser: (u) => set((state) => ({ user: { ...state.user, ...u } })),

    mode: 'mobile',
    
    scenarios: [defaultScenario],
    activeScenarioId: 'base',
    
    saasScenarios: [defaultSaas],
    activeSaasScenarioId: 'saas-base',

    results: initialResultsMobile,
    activeTacticsSection: null,

    loadUserData: async (uid) => {
      if (!uid) return;
      set({ user: { ...get().user, loading: true } });
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Merge remote data
          set((state) => {
            const newState = {
              scenarios: data.scenarios || state.scenarios,
              activeScenarioId: data.activeScenarioId || state.activeScenarioId,
              saasScenarios: data.saasScenarios || state.saasScenarios,
              activeSaasScenarioId: data.activeSaasScenarioId || state.activeSaasScenarioId,
              mode: data.mode || state.mode
            } as Partial<AppState>;

            // Recalculate based on loaded data
            let newResults;
            if (newState.mode === 'saas') {
               const active = newState.saasScenarios!.find((s: any) => s.id === newState.activeSaasScenarioId) || newState.saasScenarios![0];
               newResults = calculateSaasModel(active);
            } else {
               const active = newState.scenarios!.find((s: any) => s.id === newState.activeScenarioId) || newState.scenarios![0];
               newResults = calculateModel(active);
            }
            
            return { ...newState, results: newResults, user: { ...state.user, loading: false } };
          });
        } else {
          // New user, save defaults
          debouncedSave(uid, {
            scenarios: get().scenarios,
            activeScenarioId: get().activeScenarioId,
            saasScenarios: get().saasScenarios,
            activeSaasScenarioId: get().activeSaasScenarioId,
            mode: get().mode
          });
          set((state) => ({ user: { ...state.user, loading: false } }));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        set((state) => ({ user: { ...state.user, loading: false } }));
      }
    },

    setMode: (mode) => {
      set((state) => {
        let results;
        if (mode === 'mobile') {
          const active = state.scenarios.find(s => s.id === state.activeScenarioId) || state.scenarios[0];
          results = calculateModel(active);
        } else {
          const active = state.saasScenarios.find(s => s.id === state.activeSaasScenarioId) || state.saasScenarios[0];
          results = calculateSaasModel(active);
        }
        const newState = { mode, results };
        
        // Persist
        if (state.user.uid) debouncedSave(state.user.uid, { mode });
        
        return newState;
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
        
        const newState = {
          scenarios: [...state.scenarios, newScenario],
          activeScenarioId: newId,
          results: calculateModel(newScenario)
        };

        if (state.user.uid) debouncedSave(state.user.uid, { scenarios: newState.scenarios, activeScenarioId: newState.activeScenarioId });
        return newState;
      });
    },

    switchScenario: (id) => {
      set((state) => {
        const target = state.scenarios.find(s => s.id === id);
        if (!target) return {};
        const newState = {
          activeScenarioId: id,
          results: calculateModel(target)
        };
        if (state.user.uid) debouncedSave(state.user.uid, { activeScenarioId: newState.activeScenarioId });
        return newState;
      });
    },

    updateScenario: (partial) => {
      set((state) => {
        const updatedScenarios = state.scenarios.map(s => 
          s.id === state.activeScenarioId ? { ...s, ...partial } : s
        );
        const active = updatedScenarios.find(s => s.id === state.activeScenarioId)!;
        const newState = {
          scenarios: updatedScenarios,
          results: calculateModel(active)
        };
        if (state.user.uid) debouncedSave(state.user.uid, { scenarios: newState.scenarios });
        return newState;
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
        const newState = {
          scenarios: updatedScenarios,
          results: calculateModel(updatedScenario)
        };
        if (state.user.uid) debouncedSave(state.user.uid, { scenarios: newState.scenarios });
        return newState;
      });
    },
    
    deleteScenario: (id) => {
      set((state) => {
        if (state.scenarios.length <= 1) return {};
        const newScenarios = state.scenarios.filter(s => s.id !== id);
        const newActive = newScenarios[0];
        const newState = {
          scenarios: newScenarios,
          activeScenarioId: newActive.id,
          results: calculateModel(newActive)
        };
        if (state.user.uid) debouncedSave(state.user.uid, { scenarios: newState.scenarios, activeScenarioId: newState.activeScenarioId });
        return newState;
      });
    },

    // --- SaaS Actions ---

    updateSaasScenario: (partial) => {
      set((state) => {
        const updatedScenarios = state.saasScenarios.map(s => 
            s.id === state.activeSaasScenarioId ? { ...s, ...partial } : s
        );
        const active = updatedScenarios.find(s => s.id === state.activeSaasScenarioId)!;
        const newState = {
            saasScenarios: updatedScenarios,
            results: calculateSaasModel(active)
        };
        if (state.user.uid) debouncedSave(state.user.uid, { saasScenarios: newState.saasScenarios });
        return newState;
      });
    },

    updateNestedSaasScenario: (section, data) => {
      set((state) => {
        const active = state.saasScenarios.find(s => s.id === state.activeSaasScenarioId)!;
        // @ts-ignore
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
        const newState = {
            saasScenarios: updatedScenarios,
            results: calculateSaasModel(updatedScenario)
        };
        if (state.user.uid) debouncedSave(state.user.uid, { saasScenarios: newState.saasScenarios });
        return newState;
      });
    },

    openTactics: (section) => set({ activeTacticsSection: section }),
    closeTactics: () => set({ activeTacticsSection: null }),
  };
});