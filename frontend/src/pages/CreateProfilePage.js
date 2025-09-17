import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPatientProfile, createDoctorProfile } from '../api/client';
import './AuthPages.css';

const CreateProfilePage = () => {
  const [profileType, setProfileType] = useState('patient');
  const [profileData, setProfileData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'Male',
    phone: '',
    address: '',
    allergies: '',
    existing_conditions: '',
    medications: '',
    specialization: '',
    office_address: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (profileType === 'patient') {
        await createPatientProfile(profileData);
      } else {
        await createDoctorProfile(profileData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Failed to create profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Create Your Profile</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="profileType">Profile Type</label>
          <select
            id="profileType"
            name="profileType"
            value={profileType}
            onChange={(e) => setProfileType(e.target.value)}
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="full_name">Full Name</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={profileData.full_name}
            onChange={handleInputChange}
            required
          />
        </div>
        {profileType === 'patient' ? (
          <>
            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={profileData.date_of_birth}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={profileData.gender}
                onChange={handleInputChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={profileData.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="allergies">Allergies</label>
              <textarea
                id="allergies"
                name="allergies"
                value={profileData.allergies}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="existing_conditions">Existing Conditions</label>
              <textarea
                id="existing_conditions"
                name="existing_conditions"
                value={profileData.existing_conditions}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="medications">Medications</label>
              <textarea
                id="medications"
                name="medications"
                value={profileData.medications}
                onChange={handleInputChange}
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="specialization">Specialization</label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={profileData.specialization}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="office_address">Office Address</label>
              <textarea
                id="office_address"
                name="office_address"
                value={profileData.office_address}
                onChange={handleInputChange}
              />
            </div>
          </>
        )}
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
};

export default CreateProfilePage;