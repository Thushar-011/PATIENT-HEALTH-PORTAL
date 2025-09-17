// frontend/src/pages/AppointmentsPage.js
import React, { useState, useEffect } from 'react';
import { getAppointments, createAppointment, updateAppointment, getAllDoctors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './ListPages.css'; // We'll keep this for custom styles

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ doctor: '', appointment_datetime: '', notes: '' });
  const { isDoctor } = useAuth();

  useEffect(() => {
    fetchData();
  }, [isDoctor]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apptsData = await getAppointments();
      setAppointments(apptsData);
      if (!isDoctor) {
        const doctorsData = await getAllDoctors();
        setDoctors(doctorsData);
      }
    } catch (err) {
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await createAppointment(formData);
      setFormData({ doctor: '', appointment_datetime: '', notes: '' });
      fetchData();
    } catch (err) {
      setError('Failed to create appointment. Make sure all fields are correct.');
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const appointmentToUpdate = appointments.find(a => a.id === appointmentId);
      await updateAppointment(appointmentId, { ...appointmentToUpdate, status: newStatus });
      fetchData();
    } catch (err) {
      setError('Failed to update appointment status.');
    }
  };

  // Helper function to get the color class for the status badge
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-success';
      case 'Cancelled':
        return 'bg-danger';
      case 'Rescheduled':
        return 'bg-warning text-dark';
      case 'Requested':
      default:
        return 'bg-info text-dark';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Appointments</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Form for Patients to create appointments */}
      {!isDoctor && (
        <div className="card shadow-sm mb-5">
          <div className="card-header bg-primary text-white">
            <h2 className="h5 mb-0">Create New Appointment</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label htmlFor="doctor" className="form-label">Doctor</label>
                <select id="doctor" name="doctor" className="form-select" value={formData.doctor} onChange={(e) => setFormData({ ...formData, doctor: e.target.value })} required>
                  <option value="">Select a Doctor...</option>
                  {doctors.map(doc => (
                    <option key={doc.doctor_id} value={doc.doctor_id}>
                      Dr. {doc.full_name} - {doc.specialization}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="appointment_datetime" className="form-label">Date & Time</label>
                <input type="datetime-local" className="form-control" id="appointment_datetime" name="appointment_datetime" value={formData.appointment_datetime} onChange={(e) => setFormData({ ...formData, appointment_datetime: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label htmlFor="notes" className="form-label">Notes (Optional)</label>
                <textarea className="form-control" id="notes" name="notes" rows="3" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary">Create Appointment</button>
            </form>
          </div>
        </div>
      )}

      {/* List of existing appointments */}
      <div className="card shadow-sm">
        <div className="card-header">
          <h2 className="h5 mb-0">{isDoctor ? "Your Scheduled Appointments" : "Your Appointments"}</h2>
        </div>
        <div className="card-body p-0">
          {appointments.length > 0 ? (
            <ul className="list-group list-group-flush">
              {appointments.map(appt => (
                <li key={appt.id} className="list-group-item d-flex flex-wrap justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">
                      {isDoctor ? `Patient: ${appt.patient_name}` : `Dr. ${appt.doctor_name}`}
                    </h5>
                    <p className="mb-1 text-muted">
                      {new Date(appt.appointment_datetime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="d-flex align-items-center mt-2 mt-md-0">
                    <span className={`badge ${getStatusBadgeClass(appt.status)} me-3`}>{appt.status}</span>
                    {isDoctor && (
                      <select className="form-select form-select-sm" style={{ width: '150px' }} onChange={(e) => handleStatusChange(appt.id, e.target.value)} value={appt.status}>
                        <option value="Requested">Requested</option>
                        <option value="Approved">Approved</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Rescheduled">Rescheduled</option>
                      </select>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-3 text-center text-muted">No appointments found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;