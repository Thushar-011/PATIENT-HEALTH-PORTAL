import React, { useState, useEffect } from 'react';
import { getPrescriptions, downloadPrescriptionPdf, createPrescription, getPatientList } from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './ListPages.css';

const PrescriptionsPage = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isDoctor } = useAuth();

    // State for the creation modal
    const [showModal, setShowModal] = useState(false);
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState({
        patient: '',
        medication_name: '',
        dosage: '',
        instructions: ''
    });

    useEffect(() => {
        fetchPrescriptions();
        if (isDoctor) {
            fetchPatients();
        }
    }, [isDoctor]);

    const fetchPrescriptions = async () => {
        setLoading(true);
        try {
            const data = await getPrescriptions();
            setPrescriptions(data);
        } catch (err) {
            setError('Failed to fetch prescriptions.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const data = await getPatientList();
            setPatients(data);
        } catch (err) {
            console.error('Failed to fetch patients');
        }
    };

    const handleDownload = async (prescriptionId) => {
        try {
            const response = await downloadPrescriptionPdf(prescriptionId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `prescription_${prescriptionId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            setError('Failed to download PDF.');
        }
    };

    // in frontend/src/pages/PrescriptionsPage.js

const handleCreate = async (e) => {
    e.preventDefault();
    // Move this line to the top to clear old errors immediately
    setError(null);
    try {
        await createPrescription(formData);
        setShowModal(false);
        fetchPrescriptions();
        setFormData({ patient: '', medication_name: '', dosage: '', instructions: '' });
    } catch (err) {
        setError('Failed to create prescription. Please check all fields.');
    }
};

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>{isDoctor ? 'Issued Prescriptions' : 'Your Prescriptions'}</h1>
                {isDoctor && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Create New Prescription
                    </button>
                )}
            </div>
            {error && <div className="alert alert-danger">{error}</div>}

            {/* List of Prescriptions */}
            <div className="card shadow-sm">
                <div className="card-body p-0">
                    {prescriptions.length > 0 ? (
                        <ul className="list-group list-group-flush">
                            {prescriptions.map(p => (
                                <li key={p.id} className="list-group-item">
                                    <div className="d-flex w-100 justify-content-between">
                                        <h5 className="mb-1">{p.medication_name}</h5>
                                        <small>{new Date(p.created_at).toLocaleDateString()}</small>
                                    </div>
                                    <p className="mb-1">
                                        For: <strong>{p.patient_name}</strong> | Prescribed by: <strong>Dr. {p.doctor_name}</strong>
                                    </p>
                                    <p className="text-muted">Dosage: {p.dosage}</p>
                                    {!isDoctor && (
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDownload(p.id)}>
                                            Download PDF
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-3 text-center text-muted">No prescriptions found.</p>
                    )}
                </div>
            </div>

            {/* Create Prescription Modal for Doctors */}
            {isDoctor && showModal && (
                <div className="modal show fade" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleCreate}>
                                <div className="modal-header">
                                    <h5 className="modal-title">New Prescription</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="patient" className="form-label">Patient</label>
                                        <select className="form-select" id="patient" value={formData.patient} onChange={e => setFormData({...formData, patient: e.target.value})} required>
                                            <option value="">Select a patient...</option>
                                            {patients.map(pat => (
                                                <option key={pat.patient_id} value={pat.patient_id}>{pat.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="medication_name" className="form-label">Medication Name</label>
                                        <input type="text" className="form-control" id="medication_name" value={formData.medication_name} onChange={e => setFormData({...formData, medication_name: e.target.value})} required />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="dosage" className="form-label">Dosage (e.g., 500mg, twice a day)</label>
                                        <input type="text" className="form-control" id="dosage" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="instructions" className="form-label">Instructions</label>
                                        <textarea className="form-control" id="instructions" rows="3" value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})}></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                    <button type="submit" className="btn btn-primary">Save Prescription</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Backdrop */}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default PrescriptionsPage;