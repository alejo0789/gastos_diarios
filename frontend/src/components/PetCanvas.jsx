import React from 'react';
import { usePetStore } from '../store/usePetStore';
import { Heart, Zap, Sparkles } from 'lucide-react';

export default function PetCanvas() {
  const { pet } = usePetStore();

  // Lógica simple: si la salud baja demasiado, mostramos la imagen triste
  const isSad = pet.health <= 50;
  const imageSource = isSad ? "/sad.png" : "/happy.png";

  return (
    <div className="glass-panel pet-panel">
      <div className="card-title">
        <Sparkles className="icon-accent" size={24} />
        <h2>{pet.name}</h2>
      </div>
      <p className="text-muted" style={{textTransform: 'capitalize'}}>
        Especie: {pet.species.replace('_', ' ')} • Etapa: {pet.stage}
      </p>

      {/* ÁREA DE RENDERIZADO */}
      <div className="pet-container">
        <img src={imageSource} alt="Mascota" className="pet-image" />
        
        {/* Estadísticas Visuales (Barras) */}
        <div className="stats-container">
          
          <div className="stat-row">
            <span className="stat-label"><Heart size={16} color="#ef4444" /> Salud</span>
            <div className="status-bar">
              <div 
                className="status-fill" 
                style={{ width: `${pet.health}%`, backgroundColor: 'var(--danger)' }}
              />
            </div>
            <span className="stat-value">{pet.health}/100</span>
          </div>

          <div className="stat-row">
            <span className="stat-label"><Zap size={16} color="#f59e0b" /> XP</span>
            <div className="status-bar">
              <div 
                className="status-fill" 
                style={{ width: `${(pet.xp % 500) / 500 * 100}%`, backgroundColor: '#f59e0b' }}
              />
            </div>
            <span className="stat-value">{pet.xp}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
