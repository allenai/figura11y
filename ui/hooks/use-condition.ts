import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Type for condition store.
 *
 * @interface ConditionStore
 * @typedef {ConditionStore}
 *
 * @property {(string | null)} condition - The current experimental condition
 * @property {(condition: string) => void} setCondition - Sets current experimental condition
 * @property {() => void} clearCondition - Clears current experimental condition
 */
interface ConditionStore {
    condition: string | null;
    setCondition: (condition: string) => void;
    clearCondition: () => void;
}

/**
 * Condition store.
 *
 * @type {*}
 */
export const useConditionStore = create<ConditionStore>()(
    persist(
        (set, get) => ({
            condition: null,
            setCondition: (condition: string) => set({ condition }),
            clearCondition: () => set({ condition: null })
        }),
        {
            name: "condition-storage",
            getStorage: () => sessionStorage
        }
    )
);

export default {
    useConditionStore
};
