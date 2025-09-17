import React, { useState, useEffect } from 'react';
import { getAllDoctors } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import './ListPages.css';

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllDoctors();
        setDoctors(data);
      } catch (err) {
        setError('Failed to fetch doctors list. ' + (err.response?.data?.detail || ''));
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="list-page-container">
      <h1>Doctors</h1>
      <div className="list-container">
        {doctors.length > 0 ? (
          doctors.map(doctor => (
            <div key={doctor.user} className="list-item">
              <h3>Dr. {doctor.full_name}</h3>
              <p><strong>Specialization:</strong> {doctor.specialization}</p>
              <p><strong>Phone:</strong> {doctor.phone}</p>
              <p><strong>Office:</strong> {doctor.office_address}</p>
            </div>
          ))
        ) : (
          <p>No doctors found.</p>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;