import { usePetStore } from './store/usePetStore'
import { Wallet, Target, Sparkles, Plus, Minus } from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import './App.css'

function App() {
  const { pet, simulateExpense, simulateIncome, manageBudget, manageGoal } = usePetStore();
  const isSad = pet.health <= 50;

  return (
    <div className="mobile-app-container">
      
      {/* 1. SECCIÓN DE LA MASCOTA */}
      <div className="pet-section">
        
        <div className="top-bar">
          <div className="pet-badges">
             <span className="badge lvl-badge"><Sparkles size={14}/> Lvl. {Math.floor(pet.xp / 100) + 1}</span>
             <span className="badge species-badge">{pet.species.replace('_', ' ')}</span>
          </div>
          <div className="mini-actions">
             <button className="btn-mini btn-income" onClick={() => simulateIncome(100)}>
                <Plus size={14} /> Sueldo Extra
             </button>
             <button className="btn-mini btn-expense" onClick={() => simulateExpense(50)}>
                <Minus size={14} /> Imprevisto
             </button>
          </div>
        </div>
        
        {isSad ? (
           <img src="/sad.png" alt="Pet triste" className="pet-avatar" />
        ) : (
           <div className="pet-avatar-lottie" style={{ width: '150px', height: '150px', margin: '0.5rem 0 1rem 0' }}>
             <DotLottieReact src="/happy.lottie" loop autoplay />
           </div>
        )}
        <h2 className="pet-name">{pet.name}</h2>
        
        <div className="health-container">
           <div className="health-bar-bg">
              <div 
                className="health-bar-fill" 
                style={{
                  width: `${pet.health}%`, 
                  backgroundColor: isSad ? 'var(--danger)' : 'var(--success)'
                }}
              />
           </div>
           <p className="health-text">{pet.health} / 100 Salud</p>
        </div>
      </div>

      {/* 2. MÉTRICAS GLOBALES */}
      <div className="summary-grid">
        <div className="mini-card">
          <span className="mini-label">Ingresos</span>
          <span className="mini-value text-green">${pet.income}</span>
        </div>
        <div className="mini-card">
          <span className="mini-label">Gastos Base</span>
          <span className="mini-value text-red">${pet.general_current_spent}</span>
        </div>
        <div className="mini-card">
          <span className="mini-label">Ahorros</span>
          <span className="mini-value text-purple">${pet.savings}</span>
        </div>
      </div>

      {/* 3. SECCIÓN DE PRESUPUESTOS (CON BOTONES INDIVIDUALES) */}
      <div className="budgets-section">
        <h3 className="section-title">Mis Presupuestos</h3>
        
        {/* Presupuesto General */}
        <div className="finance-card">
          <div className="card-header-row">
            <div className="icon-wrapper bg-blue"><Wallet size={20} color="var(--accent)" /></div>
            <h3 className="card-title">Presupuesto General</h3>
          </div>
          <div className="card-amount">
            ${pet.general_current_spent.toLocaleString()} 
            <span className="text-muted text-sm" style={{marginLeft: '6px'}}> / ${pet.general_budget_limit.toLocaleString()} límite</span>
          </div>
          
          <div className="progress-bg mt-3">
            <div 
              className="progress-fill"
              style={{
                width: `${Math.min((pet.general_current_spent / pet.general_budget_limit) * 100, 100)}%`,
                backgroundColor: pet.general_current_spent > pet.general_budget_limit ? 'var(--danger)' : 'var(--accent)'
              }}
            />
          </div>
          <p className="budget-alert">
            {pet.general_current_spent > pet.general_budget_limit ? "⚠️ Presupuesto excedido (Daño a la mascota)" : "👍 Dentro del presupuesto seguro"}
          </p>
          
          {/* Botones de acción directa en la tarjeta */}
          <div className="card-actions-inline mt-3">
            <button className="btn-micro" onClick={() => manageBudget(-50)}>
              <Plus size={14}/> Reembolso $50
            </button>
            <button className="btn-micro btn-micro-danger" onClick={() => manageBudget(50)}>
              <Minus size={14}/> Registrar Gasto $50
            </button>
          </div>
        </div>

        {/* Otra Card: Meta Compartida */}
        <div className="finance-card">
          <div className="card-header-row">
            <div className="icon-wrapper bg-purple"><Target size={20} color="#8b5cf6" /></div>
            <h3 className="card-title">Viaje a Cancún (Compartida)</h3>
          </div>
          <div className="card-amount text-dark">
            ${pet.shared_goal_saved.toLocaleString()} 
            <span className="text-muted text-sm" style={{marginLeft: '6px'}}> / ${pet.shared_goal_target.toLocaleString()}</span>
          </div>
          <div className="progress-bg mt-3">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${Math.min((pet.shared_goal_saved / pet.shared_goal_target) * 100, 100)}%`, 
                backgroundColor: '#8b5cf6' 
              }} 
            />
          </div>
          <p className="text-muted text-sm mt-3">2 participantes contribuyendo de sus ahorros.</p>
          
          {/* Botones de acción directa en la tarjeta */}
          <div className="card-actions-inline mt-3">
            <button className="btn-micro" onClick={() => manageGoal(-100)}>
              <Minus size={14}/> Extraer $100
            </button>
            <button className="btn-micro btn-micro-success" onClick={() => manageGoal(100)}>
              <Plus size={14}/> Aportar $100
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
export default App
