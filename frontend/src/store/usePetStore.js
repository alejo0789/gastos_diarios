import { create } from 'zustand'

export const usePetStore = create((set, get) => ({
  current_user: JSON.parse(localStorage.getItem("tamagotchi_user")) || null,
  loginUser: (userData) => {
    localStorage.setItem("tamagotchi_user", JSON.stringify(userData));
    set({ current_user: userData });
  },
  logoutUser: () => {
    localStorage.removeItem("tamagotchi_user");
    set({ current_user: null });
  },

  pet: {
    name: "Billeterín",
    species: "piggy_bank",
    health: 85,
    happiness: 90,
    xp: 450,
    stage: "baby",
    
    income: 1800000,
    savings: 300000,
    
    general_budget_limit: 1000000,
    general_current_spent: 450000,
    general_weekly_spent: 120000,

    shared_goals: [], // Ahora las metas vienen de la Base de Datos
    fixed_expenses: []
  },
  
  setPetData: (data) => set({ pet: data }),
  
  updateGeneralBudget: (limit) => set((state) => ({
      pet: { ...state.pet, general_budget_limit: limit }
  })),

  fetchFixedExpenses: async (userId = 1) => {
    try {
      const res = await fetch(`http://localhost:8000/api/budgets/fixed-expenses/${userId}`);
      if(res.ok) {
         const data = await res.json();
         set((state) => ({ pet: { ...state.pet, fixed_expenses: data } }));
      }
    } catch(e) {}
  },
  
  fetchSummary: async (userId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/budgets/summary/${userId}`);
      if(res.ok) {
         const sum = await res.json();
         set((state) => ({
            pet: {
               ...state.pet,
               income: sum.income,
               general_current_spent: sum.expenses,
               savings: sum.savings,
               general_budget_limit: sum.budget_limit,
               general_weekly_spent: sum.expenses / 4
            }
         }));
      }
    } catch(e) {}
  },
  
  fetchSharedGoals: async (userId = 1) => {
    try {
      const res = await fetch(`http://localhost:8000/api/budgets/shared/${userId}`);
      const goals = await res.json();
      set((state) => ({
        pet: { ...state.pet, shared_goals: goals }
      }));
    } catch (e) {
      console.error("Error cargando metas compartidas:", e);
    }
  },
  
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

  // Acciones por Presupuesto/Tarjeta
  manageBudget: (amount) => set((state) => {
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
  })
}))
