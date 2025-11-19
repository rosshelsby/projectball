import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Profile() {
  const { userNumber } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userNumber]);

  const loadProfile = async () => {
    try {
      // API call to get user profile by userId
      const response = await fetch(`http://localhost:5000/api/users/profile/${userNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>Loading...</div>;
  }

  if (!profile) {
    return <div style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>Profile not found</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', marginBottom: '30px' }}>
        {profile.username} [{profile.userNumber}]
      </h1>
      
      <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '8px' }}>
        <h2 style={{ color: '#fff' }}>Manager Profile</h2>
        <p style={{ color: '#999' }}>Team: {profile.teamName}</p>
        <p style={{ color: '#999' }}>Budget: ${profile.budget?.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default Profile;