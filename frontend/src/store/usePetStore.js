import { create } from 'zustand'

export const usePetStore = create((set) => ({
  pet: {
    name: "Billeterín",
    species: "piggy_bank",
    health: 85,
    happiness: 90,
    xp: 450,
    stage: "baby",
    
    // Globals
    income: 1800,
    savings: 300,
    
    // Presupuesto General
    general_budget_limit: 1000,
    general_current_spent: 450,

    // Meta Compartida
    shared_goal_target: 20000,
    shared_goal_saved: 12000
  },
  
  setPetData: (data) => set({ pet: data }),
  
  // Acciones globales (Arriba)
  simulateExpense: (amount) => set((state) => {
    return {
      pet: {
        ...state.pet,
        savings: Math.max(0, state.pet.savings - amount),
        health: Math.max(0, state.pet.health - 5)
      }
    }
  }),

  simulateIncome: (amount) => set((state) => {
    return {
      pet: {
        ...state.pet,
        income: state.pet.income + amount,
        happiness: Math.min(100, state.pet.happiness + 5)
      }
    }
  }),

  // Acciones por Presupuesto/Trajeta
  manageBudget: (amount) => set((state) => {
    // amount + => Gasto, amount - => Reembolso
    const newSpent = Math.max(0, state.pet.general_current_spent + amount);
    const overBudget = newSpent > state.pet.general_budget_limit;
    
    return {
      pet: {
        ...state.pet,
        general_current_spent: newSpent,
        health: overBudget ? Math.max(0, state.pet.health - 20) : state.pet.health,
        xp: state.pet.xp + 5
      }
    }
  }),

  manageGoal: (amount) => set((state) => {
    // amount + => Aportar, amount - => Retirar
    const newSaved = Math.max(0, state.pet.shared_goal_saved + amount);
    
    return {
      pet: {
        ...state.pet,
        shared_goal_saved: newSaved,
        savings: state.pet.savings - amount, // Si aportas, sale de tus ahorros
        happiness: amount > 0 ? Math.min(100, state.pet.happiness + 10) : Math.max(0, state.pet.happiness - 5),
        xp: amount > 0 ? state.pet.xp + 15 : state.pet.xp
      }
    }
  })
}))
