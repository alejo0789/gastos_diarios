import { useEffect, useState } from 'react'
import { usePetStore } from './store/usePetStore'
import { Wallet, Target, Sparkles, Plus, Minus, Trash2, Edit2, X, Menu, User, Calendar, LogOut } from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import './App.css'

function App() {
  const { pet, current_user, simulateExpense, simulateIncome, manageBudget, updateGeneralBudget, expensesHistory, fetchExpensesHistory } = usePetStore();
  const isSad = pet.health <= 50;

  const [expensesModalOpen, setExpensesModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);

  const [editGeneralBudgetModal, setEditGeneralBudgetModal] = useState(false);
  const [newGeneralBudget, setNewGeneralBudget] = useState("");
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [fixedExpensesModalOpen, setFixedExpensesModalOpen] = useState(false);

  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");

  const [newFixedName, setNewFixedName] = useState("");
  const [newFixedAmount, setNewFixedAmount] = useState("");

  const [inviteModal, setInviteModal] = useState({ open: false, goalId: null });
  const [invitePhone, setInvitePhone] = useState("");

  const [isLoginView, setIsLoginView] = useState(true);
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");

  useEffect(() => {
    if (current_user) {
       usePetStore.getState().fetchSharedGoals(current_user.user_id);
       usePetStore.getState().fetchFixedExpenses(current_user.user_id);
       usePetStore.getState().fetchSummary(current_user.user_id);
    }
  }, [current_user]);

  const submitAuth = async () => {
     if(!authPhone || !authPassword) return;
     const endpoint = isLoginView ? "/api/auth/login" : "/api/auth/register";
     const body = isLoginView ? {phone_number: authPhone, password: authPassword} : {phone_number: authPhone, password: authPassword, name: authName};
     
     try {
       const req = await fetch(`https://gastosdiariosbackend-production.up.railway.app${endpoint}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
       });
       if(req.status === 400 || req.status === 401) { 
           const err = await req.json();
           alert(err.detail); return; 
       }
       const data = await req.json();
       usePetStore.getState().loginUser(data);
     } catch(e) { alert("Error conectando con el servidor en la nube. Revisa tu internet o avisa al administrador."); }
  }

  const submitFixedExpense = async () => {
      if(!newFixedName || !newFixedAmount) return;
      await fetch(`https://gastosdiariosbackend-production.up.railway.app/api/budgets/fixed-expenses`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: current_user.user_id, name: newFixedName, amount: parseFloat(newFixedAmount), day_of_month: 1 })
      });
      usePetStore.getState().fetchFixedExpenses(current_user.user_id);
      setNewFixedName(""); setNewFixedAmount("");
  }
  
  const removeFixedExpense = async (id) => {
      await fetch(`https://gastosdiariosbackend-production.up.railway.app/api/budgets/fixed-expenses/${id}`, { method: "DELETE" });
      usePetStore.getState().fetchFixedExpenses(current_user.user_id);
  }

  const submitEditGeneralBudget = async () => {
    if (!newGeneralBudget) return;
    try {
       await fetch(`https://gastosdiariosbackend-production.up.railway.app/api/budgets/limit/${current_user.user_id}`, {
          method: "PUT", headers: {"Content-Type": "application/json"},
          body: JSON.stringify({limit: parseFloat(newGeneralBudget)})
       });
       usePetStore.getState().updateGeneralBudget(parseInt(newGeneralBudget));
       setEditGeneralBudgetModal(false);
       setNewGeneralBudget("");
    } catch(e) {}
  }

  const openEditModal = (g) => {
    setEditingGoalId(g.id);
    setNewGoalName(g.name);
    setNewGoalTarget(g.target_amount);
    setEditModalOpen(true);
  }

  const submitCreateGoal = async () => {
    if (!newGoalName || !newGoalTarget) return;
    try {
      await fetch(`https://gastosdiariosbackend-production.up.railway.app/api/budgets/shared`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGoalName, target_amount: parseFloat(newGoalTarget), creator_user_id: current_user.user_id })
      });
      usePetStore.getState().fetchSharedGoals(current_user.user_id);
      setCreateModalOpen(false);
      setNewGoalName(''); setNewGoalTarget('');
    } catch(e) {
       alert("Error creando el viaje.");
    }
  }

  const submitEditGoal = async () => {
    if (!newGoalName || !newGoalTarget) return;
    try {
      await fetch(`https://gastosdiariosbackend-production.up.railway.app/api/budgets/shared/${editingGoalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGoalName, target_amount: parseFloat(newGoalTarget), creator_user_id: current_user.user_id })
      });
      usePetStore.getState().fetchSharedGoals(current_user.user_id);
      setEditModalOpen(false);
      setEditingGoalId(null);
      setNewGoalName(''); setNewGoalTarget('');
    } catch(e) {
       alert("Error actualizando el viaje.");
    }
  }

  const handleDeleteGoal = async (gId) => {
    if(!window.confirm("¿Seguro que deseas eliminar este presupuesto permanentemente? Los ahorros no se perderán, solo la meta.")) return;
    try {
      await fetch(`https://gastosdiariosbackend-production.up.railway.app/api/budgets/shared/${gId}`, { method: "DELETE" });
      usePetStore.getState().fetchSharedGoals(current_user.user_id);
    } catch(e) {}
  }

  const handleRemoveParticipant = async (gId, uId, uName) => {
    if(!window.confirm(`¿Quitar a ${uName} de la meta? Así ya no podrá aportar desde su celular.`)) return;
    try {
      await fetch(`https://gastosdiariosbackend-production.up.railway.app/api/budgets/shared/${gId}/participants/${uId}`, { method: "DELETE" });
      usePetStore.getState().fetchSharedGoals(current_user.user_id);
    } catch(e) {}
  }

  const handleInvite = async (goalId) => {
    // Intentar abrir agenda nativa primero
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const contacts = await navigator.contacts.select(props, {multiple: false});
        if (contacts.length > 0) {
          const identifier = contacts[0].tel?.[0] || contacts[0].name?.[0];
          if(identifier) {
             submitInvite(goalId, identifier);
             return;
          }
        }
      } catch (ex) {
         // Silently fallback to manual modal
      }
    }
    // Fallback: Mostrar modal hermoso nativo en React
    setInviteModal({ open: true, goalId: goalId });
  }

  const submitInvite = async (forcedGoalId, forcedPhone) => {
    const gId = forcedGoalId || inviteModal.goalId;
    const phone = forcedPhone || invitePhone;
    if(!phone) return;

    try {
      const req = await fetch(`https://gastosdiariosbackend-production.up.railway.app/api/budgets/shared/${gId}/participants`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone })
      });
      await req.json();
      usePetStore.getState().fetchSharedGoals(current_user.user_id);
      setInviteModal({ open: false, goalId: null });
      setInvitePhone("");
    } catch (e) {
      alert("Error conectando con el servidor.");
    }
  }

  if (!current_user) {
    return (
      <div className="mobile-app-container justify-center" style={{padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh', background: '#f8fafc'}}>
         <div style={{display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center'}}>
           <div style={{width: '180px', height: '180px', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.08))', marginBottom: '-15px'}}>
              <DotLottieReact src="/start2.lottie" loop autoplay />
           </div>
           <h2 style={{fontSize: '32px', color: 'var(--text-main)', marginBottom: '0', fontWeight: '800', letterSpacing: '-0.5px'}}>Easy Wallet</h2>
           <p className="text-muted text-center text-sm" style={{marginBottom: '10px'}}>{isLoginView ? "Inicia sesión para acceder a tu cuenta." : "Crea tu cuenta de finanzas personales."}</p>
           
           {!isLoginView && (
             <input type="text" placeholder="👤 Tu Nombre" className="glass-input" style={{padding: '14px', fontSize: '15px'}} value={authName} onChange={e=>setAuthName(e.target.value)} />
           )}
           <input type="text" inputMode="tel" placeholder="📞 Teléfono (WhatsApp)" className="glass-input" style={{padding: '14px', fontSize: '15px'}} value={authPhone} onChange={e=>setAuthPhone(e.target.value)} />
           <input type="password" placeholder="🔒 Contraseña segura" className="glass-input" style={{padding: '14px', fontSize: '15px'}} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} />
           
           <button className="btn-micro btn-micro-success" style={{width: '100%', padding: '16px', fontSize: '16px', marginTop: '10px', fontWeight: 'bold'}} onClick={submitAuth}>
             {isLoginView ? "Entrar" : "Registrarse"}
           </button>

           <p className="text-sm mt-3" style={{cursor:'pointer', color:'var(--accent)', fontWeight: '600'}} onClick={()=>setIsLoginView(!isLoginView)}>
             {isLoginView ? "¿Nuevo por aquí? Regístrate." : "¿Ya tienes cuenta? Inicia Sesión."}
           </p>
         </div>
      </div>
    )
  }

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
            <button className="btn-icon-tiny" onClick={() => setIsMenuOpen(true)}>
               <Menu size={24} color="var(--text-main)" />
            </button>
          </div>
        </div>
        
        <div className="pet-avatar-lottie" style={{ width: '150px', height: '150px', margin: '0.5rem 0 1rem 0', filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.1))' }}>
           <DotLottieReact 
             src={isSad ? "/sad.lottie" : "/happy.lottie"} 
             loop 
             autoplay 
           />
        </div>
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

      {/* 2. MÉTRICAS GLOBALES VERTICALES */}
      <div className="summary-list">
        <div className="summary-row">
          <span className="summary-label">Ingresos del Mes</span>
          <span className="summary-value text-green">+ ${pet.income.toLocaleString('es-CO')}</span>
        </div>
        <div className="summary-row" style={{cursor: 'pointer'}} onClick={() => { fetchExpensesHistory(current_user.user_id); setExpensesModalOpen(true); }} title="Ver Historial">
          <span className="summary-label">Gastos Totales 🔍</span>
          <span className="summary-value text-red">- ${pet.general_current_spent.toLocaleString('es-CO')}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Ahorros Destinados</span>
          <span className="summary-value text-purple">~ ${pet.savings.toLocaleString('es-CO')}</span>
        </div>
      </div>

      {/* 3. SECCIÓN DE PRESUPUESTOS (CON BOTONES INDIVIDUALES) */}
      <div className="budgets-section">
        <h3 className="section-title">Mis Presupuestos</h3>
        
        {/* Mi Presupuesto */}
        <div className="finance-card">
          <div className="card-header-row" style={{ justifyContent: 'space-between' }}>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <div className="icon-wrapper bg-blue"><Wallet size={20} color="var(--accent)" /></div>
              <h3 className="card-title">Mi Presupuesto</h3>
            </div>
            <div style={{display:'flex', cursor:'pointer', alignItems: 'center'}}>
               <Edit2 size={16} className="text-muted hover-accent" onClick={() => { setNewGeneralBudget(pet.general_budget_limit.toString()); setEditGeneralBudgetModal(true); }} />
            </div>
          </div>
          
          <div className="card-amount mt-3">
            ${pet.general_current_spent.toLocaleString('es-CO')} 
            <span className="text-muted text-sm" style={{marginLeft: '6px'}}> / ${pet.general_budget_limit.toLocaleString('es-CO')} Límite Men.</span>
          </div>

          <div className="progress-bg mt-2">
            <div 
              className="progress-fill"
              style={{
                width: `${Math.min((pet.general_current_spent / pet.general_budget_limit) * 100, 100)}%`,
                backgroundColor: pet.general_current_spent > pet.general_budget_limit ? 'var(--danger)' : 'var(--accent)'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>SEMANA ACTUAL</span>
               <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px'}}>
                 <span style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: '700' }}>${pet.general_weekly_spent?.toLocaleString('es-CO') || '0'}</span>
                 <span style={{ fontSize: '11px', color: '#94a3b8' }}>/ ${(pet.general_budget_limit / 4).toLocaleString('es-CO')}</span>
               </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
               <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>MES ACTUAL</span>
               <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px'}}>
                 <span style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: '700' }}>${pet.general_current_spent.toLocaleString('es-CO')}</span>
               </div>
            </div>
          </div>
          
          <p className="budget-alert mt-4 mb-1" style={{ fontSize: '12px' }}>
            {pet.general_current_spent > pet.general_budget_limit ? "⚠️ Presupuesto mensual excedido (Daño a la mascota)" : "👍 Vas súper bien, sigue cuidando a tu mascota."}
          </p>
        </div>

        {/* METAS Y VIAJES DINÁMICOS DESDE LA BD */}
        <div className="goals-header mt-3">
           <h3 className="section-title" style={{margin:0}}>Presupuestos Compartidos</h3>
           <button className="btn-mini btn-income" onClick={() => setCreateModalOpen(true)}>
             <Plus size={14}/> Nuevo Presupuesto
           </button>
        </div>

        {pet.shared_goals.map(goal => (
          <div className="finance-card" key={goal.id}>
            <div className="card-header-row" style={{ justifyContent: 'space-between' }}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <div className="icon-wrapper bg-purple"><Target size={20} color="#8b5cf6" /></div>
                <h3 className="card-title">{goal.name}</h3>
              </div>
              <div style={{display:'flex', gap:'14px', cursor:'pointer', alignItems: 'center'}}>
                <Edit2 size={16} className="text-muted hover-accent" onClick={() => openEditModal(goal)} />
                <Trash2 size={16} className="text-muted hover-danger" onClick={() => handleDeleteGoal(goal.id)} />
              </div>
            </div>
            
            <div className="card-amount text-dark mt-2">
              ${goal.saved_amount.toLocaleString()} 
              <span className="text-muted text-sm" style={{marginLeft: '6px'}}> / ${goal.target_amount.toLocaleString()}</span>
            </div>
            
            <div className="progress-bg mt-3">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min((goal.saved_amount / goal.target_amount) * 100, 100)}%`, 
                  backgroundColor: '#8b5cf6' 
                }} 
              />
            </div>
            
            <div className="participants-list mt-3">
               <p className="text-sm font-semibold" style={{marginBottom: '6px'}}>Aportes de los miembros:</p>
               {goal.participants.map((p, idx) => (
                 <div className="participant-row" key={idx}>
                   <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                     {p.id !== current_user?.user_id && (
                       <button onClick={() => handleRemoveParticipant(goal.id, p.id, p.name)} className="btn-icon-tiny" title="Quitar participante">
                          <X size={14} fill="currentColor" color="var(--danger)" />
                       </button>
                     )}
                     <span className="participant-name">{p.id === current_user?.user_id ? "Yo (Mi aporte)" : (p.name || "Desconocido")}</span>
                   </div>
                   <span className="participant-amount">${p.contributed.toLocaleString()}</span>
                 </div>
               ))}
               {goal.participants.length === 0 && (
                 <p className="text-muted text-sm pb-1">Nadie ha aportado todavía.</p>
               )}
            </div>
            
            {/* Botón para solicitar invitar un contacto del teléfono */}
            <div className="card-actions-inline mt-3">
              <button className="btn-micro" onClick={() => handleInvite(goal.id)}>
                <Plus size={14}/> Seleccionar Nuevo Contacto
              </button>
            </div>
          </div>
        ))}

      </div>

      {/* MODAL HISTORIAL DE GASTOS */}
      {expensesModalOpen && (
        <div className="modal-overlay" onClick={() => setExpensesModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '85vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>Historial de Gastos</h3>
                <p className="text-muted text-sm m-0">Tus movimientos más recientes.</p>
              </div>
              <button className="btn-icon-tiny" onClick={() => setExpensesModalOpen(false)}>
                <X size={20} className="text-muted hover-danger" />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {(!expensesHistory || expensesHistory.length === 0) ? (
                 <p className="text-center text-muted text-sm mt-4">No tienes gastos registrados aún.</p>
              ) : (
                 expensesHistory.map(exp => (
                   <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.03)' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', textTransform: 'capitalize' }}>{exp.category}</span>
                        {exp.description && <span style={{ fontSize: '13px', color: '#475569' }}>{exp.description}</span>}
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date(exp.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--danger)' }}>-${exp.amount.toLocaleString('es-CO')}</span>
                   </div>
                 ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR META (GLASSMORPHISM) */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>Nuevo Presupuesto</h3>
              <p className="text-muted text-sm m-0">Define un nombre y el monto límite o meta que desean administrar en equipo.</p>
            </div>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
              Nombre Descriptivo
              <input type="text" placeholder="📝 Ej. Gastos de la Casa, Viaje..." className="glass-input" 
                value={newGoalName} onChange={e => setNewGoalName(e.target.value)} />
            </label>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
              Presupuesto
              <input type="text" inputMode="numeric" placeholder="💰 Ej. 50.000" className="glass-input" 
                 value={newGoalTarget ? Number(newGoalTarget).toLocaleString('es-CO') : ''} 
                 onChange={e => setNewGoalTarget(e.target.value.replace(/\D/g, ''))} />
            </label>
            
            <div className="modal-actions mt-2">
              <button className="btn-micro btn-micro-danger" style={{ padding: '8px 16px' }} onClick={() => setCreateModalOpen(false)}>Cancelar</button>
              <button className="btn-micro btn-micro-success" style={{ padding: '8px 16px' }} onClick={submitCreateGoal}>Guardar Presupuesto</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INVITAR CONTACTO (GLASSMORPHISM) */}
      {inviteModal.open && (
        <div className="modal-overlay" onClick={() => setInviteModal({open: false, goalId: null})}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>Invitar Participante</h3>
              <p className="text-muted text-sm m-0">Ingresa el celular de la persona que se unirá a este presupuesto.</p>
            </div>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
              Número de Celular o Usuario
              <input type="text" placeholder="📞 Ej. 573210000000" className="glass-input" 
                 value={invitePhone} onChange={e => setInvitePhone(e.target.value)} />
            </label>
            
            <div className="modal-actions mt-2">
              <button className="btn-micro btn-micro-danger" style={{ padding: '8px 16px' }} onClick={() => setInviteModal({open: false, goalId: null})}>Cancelar</button>
              <button className="btn-micro btn-micro-success" style={{ padding: '8px 16px' }} onClick={() => submitInvite(null, null)}>Vincular Amigo</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR META (GLASSMORPHISM) */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>Editar Presupuesto</h3>
              <p className="text-muted text-sm m-0">Modifica libremente el nombre o el dinero objetivo.</p>
            </div>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
              Nombre
              <input type="text" className="glass-input" 
                value={newGoalName} onChange={e => setNewGoalName(e.target.value)} />
            </label>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
              Presupuesto
              <input type="text" inputMode="numeric" className="glass-input" 
                 value={newGoalTarget ? Number(newGoalTarget).toLocaleString('es-CO') : ''} 
                 onChange={e => setNewGoalTarget(e.target.value.replace(/\D/g, ''))} />
            </label>
            
            <div className="modal-actions mt-2">
              <button className="btn-micro btn-micro-danger" style={{ padding: '8px 16px' }} onClick={() => setEditModalOpen(false)}>Cancelar</button>
              <button className="btn-micro btn-micro-success" style={{ padding: '8px 16px' }} onClick={submitEditGoal}>Actualizar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PRESUPUESTO GENERAL (GLASSMORPHISM) */}
      {editGeneralBudgetModal && (
        <div className="modal-overlay" onClick={() => setEditGeneralBudgetModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>Configurar Presupuesto</h3>
              <p className="text-muted text-sm m-0">El dinero máximo a gastar. Se dividirá entre 4 semanas automáticamente para tu meta semanal.</p>
            </div>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
              Límite Mensual Total
              <input type="text" inputMode="numeric" placeholder="💰 Ej. 1.000.000" className="glass-input" 
                 value={newGeneralBudget ? Number(newGeneralBudget).toLocaleString('es-CO') : ''} 
                 onChange={e => setNewGeneralBudget(e.target.value.replace(/\D/g, ''))} />
            </label>
            
            <div className="modal-actions mt-2">
              <button className="btn-micro btn-micro-danger" style={{ padding: '8px 16px' }} onClick={() => setEditGeneralBudgetModal(false)}>Cancelar</button>
              <button className="btn-micro btn-micro-success" style={{ padding: '8px 16px' }} onClick={submitEditGeneralBudget}>Actualizar Límite</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <>
        {isMenuOpen && <div className="modal-overlay" style={{background: 'rgba(0,0,0,0.2)', backdropFilter:'blur(2px)'}} onClick={() => setIsMenuOpen(false)} />}
        <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
             <h3 style={{margin:0}}>Ajustes</h3>
             <X size={20} className="text-muted hover-danger" onClick={() => setIsMenuOpen(false)} style={{cursor: 'pointer'}} />
          </div>
          <div className="sidebar-content">
             <button className="sidebar-item" onClick={() => {setIsMenuOpen(false); setUserProfileModalOpen(true);}}>
                <User size={18} color="var(--accent)"/> Mi Perfil
             </button>
             <button className="sidebar-item" onClick={() => {setIsMenuOpen(false); setFixedExpensesModalOpen(true);}}>
                <Calendar size={18} color="var(--purple)"/> Gastos Fijos
             </button>
             <div className="sidebar-divider"></div>
             <button className="sidebar-item text-danger" onClick={() => usePetStore.getState().logoutUser()}>
                <LogOut size={18} color="var(--danger)"/> Salir de la App
             </button>
          </div>
        </div>
      </>

      {/* MODAL PERFIL DE USUARIO */}
      {userProfileModalOpen && (
        <div className="modal-overlay" onClick={() => setUserProfileModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>Mi Perfil</h3>
              <p className="text-muted text-sm m-0">Actualiza tus datos para que Easy Wallet y tus amigos sepan quién eres.</p>
            </div>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
              Nombre / Alias
              <input type="text" placeholder="📝 Ej. Alejandro" className="glass-input" defaultValue={current_user?.name} disabled style={{opacity: 0.8}} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
              Teléfono (Asociado a WhatsApp)
              <input type="text" className="glass-input" defaultValue={current_user?.phone_number} disabled style={{opacity: 0.6}} />
            </label>
            
            <div className="modal-actions mt-2">
              <button className="btn-micro btn-micro-success" style={{ padding: '8px 16px' }} onClick={() => setUserProfileModalOpen(false)}>Regresar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANEACIÓN GASTOS FIJOS */}
      {fixedExpensesModalOpen && (
        <div className="modal-overlay" onClick={() => setFixedExpensesModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>Planeamiento de Gastos Fijos</h3>
              <p className="text-muted text-sm m-0">Pagos recurrentes que se restarán siempre de tu presupuesto cada 1ro de mes.</p>
            </div>
            
            <div style={{background: '#f8fafc', padding: '12px', borderRadius:'12px', display:'flex', flexDirection:'column', gap:'10px'}}>
               {pet.fixed_expenses?.map((g) => (
                 <div key={g.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '6px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                       <button onClick={() => removeFixedExpense(g.id)} className="btn-icon-tiny" title="Quitar gasto">
                          <X size={14} color="var(--danger)" />
                       </button>
                       <span style={{fontSize:'14px', fontWeight:'500'}}>{g.name}</span>
                    </div>
                    <span style={{fontSize:'14px', fontWeight:'bold', color:'var(--danger)'}}>- ${g.amount.toLocaleString('es-CO')}</span>
                 </div>
               ))}
               {(!pet.fixed_expenses || pet.fixed_expenses.length === 0) && (
                 <p className="text-muted text-sm m-0 pt-1 pb-1">No has configurado gastos fijos aún.</p>
               )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                 Nuevo Concepto Fijo
                 <input type="text" placeholder="📝 Ej. Suscripción a Netflix" className="glass-input" style={{padding: '10px 14px'}} value={newFixedName} onChange={e => setNewFixedName(e.target.value)} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                 Costo Mensual
                 <input type="text" inputMode="numeric" placeholder="💰 Ej. 25.000" className="glass-input" style={{padding: '10px 14px'}} value={newFixedAmount ? Number(newFixedAmount).toLocaleString('es-CO') : ''} onChange={e => setNewFixedAmount(e.target.value.replace(/\D/g, ''))} />
               </label>
               <button className="btn-micro btn-income mt-2" onClick={submitFixedExpense} style={{width: '100%', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', border: '1px solid #bbf7d0', fontWeight: '600', cursor: 'pointer'}}><Plus size={18} color="var(--success)" /> Confirmar Gasto Fijo</button>
            </div>
            
            <div className="modal-actions mt-2">
              <button className="btn-micro btn-micro-success" style={{ padding: '8px 16px' }} onClick={() => setFixedExpensesModalOpen(false)}>Terminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
export default App
