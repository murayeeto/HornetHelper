import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Account.css';

const DEFAULT_PROFILE_PIC = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

const Account = () => {
  const { user, updateMajor, updateDisplayName, updateProfilePicture, upgradeToHornet, downgradeFromHornet } = useAuth();
  const [major, setMajor] = useState(user?.major || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditingMajor, setIsEditingMajor] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleMajorSubmit = async (e) => {
    e.preventDefault();
    if (!major.trim()) return;

    try {
      await updateMajor(major.trim());
      setIsEditingMajor(false);
      setMessage('Major updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update major:', error);
      setMessage('Failed to update major. Please try again.');
    }
  };

  const handleDisplayNameSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    try {
      if (displayName.length > 14) {
        setMessage('Display name must be 14 characters or less');
        return;
      }
      await updateDisplayName(displayName.trim());
      setIsEditingName(false);
      setMessage('Display name updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update display name:', error);
      setMessage(error.message || 'Failed to update display name. Please try again.');
    }
  };

  const handlePhotoClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setMessage('Uploading photo...');

      await updateProfilePicture(file);
      
      setMessage('Profile picture updated successfully!');
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      setMessage(error.message || 'Failed to update profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setMajor(user.major || '');
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  if (!user) {
    return <div className="account-page">Please log in to view your account.</div>;
  }

  return (
    <div className="account-page">
      <div className="account-container">
        <h1>Account Settings</h1>
        
        <div className="account-section">
          <div className="profile-header">
            <div 
              className={`profile-picture-container ${isUploading ? 'uploading' : ''}`} 
              onClick={handlePhotoClick}
              style={{ cursor: isUploading ? 'wait' : 'pointer' }}
            >
              <img 
                key={user.photoURL} // Force re-render when URL changes
                src={user.photoURL || DEFAULT_PROFILE_PIC} 
                alt="Profile" 
                className="profile-picture-large"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_PROFILE_PIC;
                }}
              />
              <div className="profile-picture-overlay">
                <span>{isUploading ? 'Uploading...' : 'Change Photo'}</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden-input"
                disabled={isUploading}
              />
            </div>
            <div className="profile-title">
              <h2>Profile Information</h2>
            </div>
          </div>
          <div className="profile-info">
            <div className="info-group">
              <label>Display Name</label>
              {isEditingName ? (
                <form onSubmit={handleDisplayNameSubmit} className="edit-form">
                  <div className="input-container">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      className="name-input"
                      maxLength={14}
                    />
                    <span className="char-count">
                      {displayName.length}/14
                    </span>
                  </div>
                  <div className="button-group">
                    <button type="submit" className="save-btn">
                      Save
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditingName(false);
                        setDisplayName(user.displayName);
                      }}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="info-display">
                  <p>{user.displayName}</p>
                  <button onClick={() => setIsEditingName(true)} className="edit-btn">
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="info-group">
              <label>Email</label>
              <p>{user.email}</p>
            </div>

            <div className="info-group">
              <label>Major</label>
              {isEditingMajor ? (
                <form onSubmit={handleMajorSubmit} className="edit-form">
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="Enter your major"
                    className="major-input"
                  />
                  <div className="button-group">
                    <button type="submit" className="save-btn">
                      Save
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditingMajor(false);
                        setMajor(user.major || '');
                      }}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="info-display">
                  <p>{user.major === 'non denominated' ? 'Not set' : user.major}</p>
                  <button onClick={() => setIsEditingMajor(true)} className="edit-btn">
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="account-section">
          <h2>Account Details</h2>
          <div className="profile-info">
            <div className="info-group">
              <label>Account Status</label>
              <div className="info-display">
                <p>{user.isHornet ? 'Hornet' : 'Standard'}</p>
                {!user.isHornet ? (
                  <button
                    onClick={() => {
                      if (window.confirm('Would you like to upgrade to Hornet status?')) {
                        upgradeToHornet()
                          .then(() => setMessage('Successfully upgraded to Hornet!'))
                          .catch(error => setMessage(error.message));
                      }
                    }}
                    className="edit-btn"
                  >
                    ↑ Upgrade
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (window.confirm('Would you like to downgrade back to Standard status?')) {
                        downgradeFromHornet()
                          .then(() => setMessage('Successfully downgraded to Standard!'))
                          .catch(error => setMessage(error.message));
                      }
                    }}
                    className="edit-btn"
                  >
                    ↓ Downgrade
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div 
            className={`message ${
              message.includes('Uploading') ? 'info' : 
              message.includes('Failed') || message.includes('must be') ? 'error' : 
              'success'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;