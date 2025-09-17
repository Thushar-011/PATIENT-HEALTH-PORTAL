import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyPatientProfile, getAppointments, getEMRs, getHealthMetrics, getAllDoctors } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { getUserId } from '../utils/auth';
import './DashboardPage.css';

const DashboardPage = () => {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [emrs, setEmrs] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPatient, setIsPatient] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      setError(null);
      try {
        const patientData = await getMyPatientProfile();
        if (patientData && patientData.length > 0) {
          setProfile(patientData[0]);
          setIsPatient(true);
          const [appts, emrData, metrics] = await Promise.all([
            getAppointments(),
            getEMRs(),
            getHealthMetrics(),
          ]);
          setAppointments(appts);
          setEmrs(emrData);
          setHealthMetrics(metrics);
        } else {
          // No patient profile, check for a doctor profile
          setIsPatient(false);
          const userId = getUserId();
          if (!userId) {
            setError('User ID not found. Please log in again.');
            return;
          }
          const doctorData = await getAllDoctors();
          const myDoctorProfile = doctorData.find(doc => doc.user === parseInt(userId));
          if (myDoctorProfile) {
            setProfile(myDoctorProfile);
            const [appts, emrData] = await Promise.all([
              getAppointments(),
              getEMRs(),
            ]);
            setAppointments(appts);
            setEmrs(emrData);
          } else {
            setError('Profile not found. Please create one.');
          }
        }
      } catch (err) {
        setError('Failed to fetch dashboard data. ' + (err.response?.data?.detail || ''));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!profile) {
    return <div className="dashboard-container"><h1>Dashboard</h1><p>No profile found. Please create one from the previous page.</p></div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Welcome, {profile.full_name}!</h1>
      <p>This is your personal healthcare dashboard.</p>

      {isPatient ? (
        <>
          <div className="dashboard-section">
            <h2>Your Appointments</h2>
            {appointments.length > 0 ? (
              appointments.map(appt => (
                <div key={appt.id} className="card">
                  <p><strong>Appointment Time:</strong> {new Date(appt.appointment_datetime).toLocaleString()}</p>
                  <p><strong>Status:</strong> {appt.status}</p>
                  <p><strong>Notes:</strong> {appt.notes}</p>
                </div>
              ))
            ) : (
              <p>You have no appointments.</p>
            )}
          </div>
          
          <div className="dashboard-section">
            <h2>Your Health Metrics</h2>
            {healthMetrics.length > 0 ? (
              healthMetrics.map(metric => (
                <div key={metric.id} className="card">
                  <p><strong>Type:</strong> {metric.metric_type}</p>
                  <p><strong>Value:</strong> {metric.value} {metric.unit}</p>
                  <p><strong>Recorded At:</strong> {new Date(metric.recorded_at).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p>No health metrics recorded.</p>
            )}
          </div>
          
          <div className="dashboard-section">
            <h2>Your Medical Records (EMR)</h2>
            {emrs.length > 0 ? (
              emrs.map(emr => (
                <div key={emr.id} className="card">
                  <p><strong>Diagnosis:</strong> {emr.diagnosis}</p>
                  <p><strong>Treatment:</strong> {emr.treatment_plan}</p>
                  <p><strong>Created At:</strong> {new Date(emr.created_at).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p>No medical records found.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="dashboard-section">
            <h2>Your Specialization</h2>
            <p>{profile.specialization}</p>
          </div>
          <div className="dashboard-section">
            <h2>Appointments to Review</h2>
            {appointments.length > 0 ? (
              appointments.map(appt => (
                <div key={appt.id} className="card">
                  <p><strong>Patient:</strong> {appt.patient}</p>
                  <p><strong>Appointment Time:</strong> {new Date(appt.appointment_datetime).toLocaleString()}</p>
                  <p><strong>Status:</strong> {appt.status}</p>
                </div>
              ))
            ) : (
              <p>You have no appointments to review.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;