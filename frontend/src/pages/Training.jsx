import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrainingFacilities, upgradeFacility } from '../services/api';

function Training() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const facilitiesData = await getTrainingFacilities();
      setData(facilitiesData);
    } catch (err) {
      console.error('Failed to load facilities:', err);
      setError('Failed to load training facilities');
      
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (facilityType) => {
    setUpgrading(facilityType);
    try {
      await upgradeFacility(facilityType);
      await loadData(); // Reload data
      alert('Facility upgraded successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upgrade facility');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>Loading facilities...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: 'red' }}>{error || 'No data available'}</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '20px auto', 
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>Training Facilities</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Budget Display */}
      <div style={{ 
        backgroundColor: '#007bff', 
        color: 'white',
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>{data.team.name}</h2>
        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          Budget: ${data.team.budget.toLocaleString()}
        </p>
      </div>

      {/* Facilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Training Ground */}
        <div style={{
          border: '2px solid #28a745',
          borderRadius: '8px',
          padding: '30px',
          backgroundColor: '#0f3a66ff'
        }}>
          <h2 style={{ marginTop: 0, color: '#28a745' }}>🏟️ Training Ground</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#28a745' }}>
              Level {data.facilities.trainingGround.level}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Max Level: {data.facilities.trainingGround.maxLevel}
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#7d33f3ff', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Benefits:</h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Base training: +1 stat point</li>
              <li>Level 5+: +2 stat points</li>
              <li>Level 10: +3 stat points</li>
            </ul>
          </div>

          {data.facilities.trainingGround.level < 10 ? (
            <>
              <div style={{ marginBottom: '15px' }}>
                <strong>Upgrade Cost:</strong> ${data.facilities.trainingGround.upgradeCost?.toLocaleString()}
              </div>
              <button
                onClick={() => handleUpgrade('training_ground')}
                disabled={!data.facilities.trainingGround.canUpgrade || upgrading === 'training_ground'}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: data.facilities.trainingGround.canUpgrade ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: data.facilities.trainingGround.canUpgrade ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {upgrading === 'training_ground' ? 'Upgrading...' : 
                 !data.facilities.trainingGround.canUpgrade ? 'Insufficient Funds' : 
                 `Upgrade to Level ${data.facilities.trainingGround.level + 1}`}
              </button>
            </>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              backgroundColor: '#7d33f3ff',
              borderRadius: '4px',
              color: '#155724',
              fontWeight: 'bold'
            }}>
              ✅ MAX LEVEL REACHED
            </div>
          )}
        </div>

        {/* Medical Facility */}
        <div style={{
          border: '2px solid #dc3545',
          borderRadius: '8px',
          padding: '30px',
          backgroundColor: '#0f3a66ff'
        }}>
          <h2 style={{ marginTop: 0, color: '#dc3545' }}>🏥 Medical Facility</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#dc3545' }}>
              Level {data.facilities.medicalFacility.level}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Max Level: {data.facilities.medicalFacility.maxLevel}
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#7d33f3ff', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Benefits:</h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Reduces injury risk (Coming soon)</li>
              <li>Faster player recovery (Coming soon)</li>
              <li>Better fitness maintenance (Coming soon)</li>
            </ul>
          </div>

          {data.facilities.medicalFacility.level < 10 ? (
            <>
              <div style={{ marginBottom: '15px' }}>
                <strong>Upgrade Cost:</strong> ${data.facilities.medicalFacility.upgradeCost?.toLocaleString()}
              </div>
              <button
                onClick={() => handleUpgrade('medical_facility')}
                disabled={!data.facilities.medicalFacility.canUpgrade || upgrading === 'medical_facility'}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: data.facilities.medicalFacility.canUpgrade ? '#dc3545' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: data.facilities.medicalFacility.canUpgrade ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {upgrading === 'medical_facility' ? 'Upgrading...' : 
                 !data.facilities.medicalFacility.canUpgrade ? 'Insufficient Funds' : 
                 `Upgrade to Level ${data.facilities.medicalFacility.level + 1}`}
              </button>
            </>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              backgroundColor: '#7d33f3ff',
              borderRadius: '4px',
              color: '#721c24',
              fontWeight: 'bold'
            }}>
              ✅ MAX LEVEL REACHED
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#855a0bff',
        borderRadius: '8px',
        border: '1px solid #b3d9ff'
      }}>
        <h3 style={{ marginTop: 0 }}>💡 Training Tips</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Higher level facilities provide better training results</li>
          <li>Each player can only train once every 24 hours</li>
          <li>Training costs $50,000 per session</li>
          <li>Improved stats help you win more matches!</li>
          <li>Go to your Squad page to train individual players</li>
        </ul>
      </div>
    </div>
  );
}

export default Training;