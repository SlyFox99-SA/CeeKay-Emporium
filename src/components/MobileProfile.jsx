import { useEffect, useState } from 'react';
import { User, Settings, ChevronRight, Award } from 'lucide-react';
import { getProfile } from '../services/customerService';
import Preferences from './Preferences';
import MobileLoyaltyCard from './MobileLoyaltyCard';

export default function MobileProfile() {
  const [profile, setProfile] = useState({ name: '', phone: '' });

  useEffect(() => {
    const p = getProfile();
    if (p) setProfile(p);
  }, []);

  return (
    <div className="mobile-profile-view">
      {/* Header */}
      <div className="m-profile-header">
        <div className="m-profile-avatar">
          <User size={32} color="var(--ck-brand)" />
        </div>
        <div className="m-profile-info">
          <h2>{profile.name || 'Guest User'}</h2>
          <p>{profile.phone || 'No phone number saved'}</p>
        </div>
      </div>

      {/* The Trophy (Loyalty) */}
      <div className="m-profile-section-title">
        <Award size={14} /> Your Rewards
      </div>
      <MobileLoyaltyCard />

      {/* Settings */}
      <div className="m-profile-section-title" style={{ marginTop: 32 }}>
        <Settings size={14} /> App Preferences
      </div>
      <div className="m-profile-card">
        <Preferences isInline={true} />
      </div>
      
      {/* Footer info */}
      <div className="m-profile-footer">
        <span>CeeKay Emporium</span>
        <span>v1.0.0 (Native)</span>
      </div>
    </div>
  );
}