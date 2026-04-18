import React from 'react';
import './Family.css';
import { useAppContext } from '../context/AppContext';
import { MailPlus, Users, X, Flame } from 'lucide-react';

export default function Family() {
  const { family, addFamilyMember } = useAppContext();
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [newMember, setNewMember] = React.useState({
    name: '',
    relationship: 'Parent',
    contact: ''
  });

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.contact) return;
    
    const success = await addFamilyMember({
      ...newMember,
      icon: newMember.name.charAt(0).toUpperCase(),
      adherence: 0,
      completed: 0,
      total: 0,
      streak: 0
    });

    if (success) {
      setShowInviteModal(false);
      setNewMember({ name: '', relationship: 'Parent', contact: '' });
    }
  };

  return (
    <div className="family-page animate-fade-in">
      <div className="family-header">
        <div className="family-icon-box">
          <Users size={32} color="var(--secondary)" />
        </div>
        <h1>Family Dashboard</h1>
        <p>{family.length + 1} members connected</p>
      </div>

      <div className="family-content">
        <button className="invite-btn" onClick={() => setShowInviteModal(true)}>
          <MailPlus size={20} />
          <span>Invite Family Member</span>
        </button>

        <h3 className="section-title">Family Members</h3>
        
        <div className="family-list">
          {family.map(member => (
            <div key={member.id} className="family-card">
              <div className="member-header">
                <div className="member-avatar">{member.icon}</div>
                <div className="member-info">
                  <h4>{member.name} <span>✅</span></h4>
                  <p>{member.email}</p>
                </div>
                <button className="remove-btn"><X size={20} color="#999" /></button>
              </div>
              
              <div className="member-stats">
                <div className="stat-circle-small">
                  <span className="percent">{member.adherence}%</span>
                  <span className="label">Adherence</span>
                </div>
                <div className="stat-item">
                  <span className="val">{member.completed}/{member.total}</span>
                  <span className="lab">Today</span>
                </div>
                <div className="stat-item">
                  <span className="val"><Flame size={16} color="#e74c3c" style={{display:'inline', verticalAlign: 'text-bottom'}}/> {member.streak}</span>
                  <span className="lab">Streak</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInviteModal && (
        <div className="modal-overlay animate-fade-in" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div className="modal-content animate-slide-up" style={{background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%'}}>
            <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{margin: 0}}>Invite Family Member</h3>
              <button onClick={() => setShowInviteModal(false)}><X size={24} color="#666" /></button>
            </div>
            <form onSubmit={handleInviteSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <input 
                type="text" 
                placeholder="Name" 
                value={newMember.name}
                onChange={e => setNewMember({...newMember, name: e.target.value})}
                required
                style={{padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}}
              />
              <select 
                value={newMember.relationship}
                onChange={e => setNewMember({...newMember, relationship: e.target.value})}
                style={{padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}}
              >
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
              <input 
                type="text" 
                placeholder="Phone or Email" 
                value={newMember.contact}
                onChange={e => setNewMember({...newMember, contact: e.target.value})}
                required
                style={{padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}}
              />
              <button type="submit" className="invite-btn" style={{marginBottom: 0}}>
                Add Member
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
