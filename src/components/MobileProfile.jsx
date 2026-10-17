import { useEffect, useState } from 'react';
import { User, Phone, Settings, ChevronRight, LogOut } from 'lucide-react';
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
      <div className="mobile-profile-header">
        <div className="mobile-profile-avatar">
          <User size={32} color="var(--ck-brand)" />
        </div>
        <div className="mobile-profile-info">
          <h2>{profile.name || 'Guest User'}</h2>
          <p>{profile.phone || 'No phone number saved'}</p>
        </div>
      </div>

      <MobileLoyaltyCard />

      <div className="mobile-profile-section">
        <h3 className="mobile-profile-section-title">Preferences</h3>
        <div className="mobile-profile-card">
          <Preferences isInline={true} />
        </div>
      </div>
      
      <div className="mobile-profile-section">
        <h3 className="mobile-profile-section-title">About</h3>
        <div className="mobile-profile-card">
          <div className="mobile-profile-row">
            <span>App Version</span>
            <span className="mobile-profile-value">1.0.0 (Native)</span>
          </div>
          <div className="mobile-profile-row">
            <span>Store</span>
            <span className="mobile-profile-value">Benoni</span>
          </div>
        </div>
      </div>
    </div>
  );
}