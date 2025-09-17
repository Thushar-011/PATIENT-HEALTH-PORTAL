# core/models.py
from django.db import models
from django.contrib.auth.models import User
from .utils import generate_custom_id # Import the new function

# Choices for ENUM fields
GENDER_CHOICES = (
    ('Male', 'Male'),
    ('Female', 'Female'),
    ('Other', 'Other'),
)

APPOINTMENT_STATUS_CHOICES = (
    ('Requested', 'Requested'),
    ('Approved', 'Approved'),
    ('Rescheduled', 'Rescheduled'),
    ('Cancelled', 'Cancelled'),
)

# 1. User-related Profile Models
class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    patient_id = models.CharField(max_length=20, unique=True, editable=False)
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    existing_conditions = models.TextField(blank=True)
    medications = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.patient_id:
            self.patient_id = generate_custom_id('PAT')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.patient_id})"

def default_doctor_id():
    return generate_custom_id('DOC')


class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    doctor_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False
    )
    full_name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    office_address = models.TextField(blank=True)

    # This save method is now the ONLY place the ID is generated
    def save(self, *args, **kwargs):
        if not self.doctor_id:
            self.doctor_id = generate_custom_id('DOC')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Dr. {self.full_name} ({self.doctor_id})"


# 2. Core Healthcare Models
class EMR(models.Model):
    patient = models.ForeignKey(Patient, to_field='patient_id', on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, to_field='doctor_id', on_delete=models.SET_NULL, null=True, blank=True)
    diagnosis = models.TextField(blank=True)
    treatment_plan = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"EMR for {self.patient.full_name} on {self.created_at.strftime('%Y-%m-%d')}"

class Prescription(models.Model):
    # We are simplifying this model to be more direct
    patient = models.ForeignKey(Patient, to_field='patient_id', on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, to_field='doctor_id', on_delete=models.CASCADE)
    medication_name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=50, blank=True)
    instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.medication_name} for {self.patient.full_name}"

class LabResult(models.Model):
    emr = models.ForeignKey(EMR, on_delete=models.CASCADE)
    test_name = models.CharField(max_length=100)
    test_date = models.DateField(null=True, blank=True)
    result_file_path = models.CharField(max_length=255, blank=True) # Could be a FileField later
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Lab Result: {self.test_name} for {self.emr.patient.full_name}"

class Appointment(models.Model):
    patient = models.ForeignKey(Patient, to_field='patient_id', on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, to_field='doctor_id', on_delete=models.CASCADE)
    appointment_datetime = models.DateTimeField()
    status = models.CharField(max_length=20, choices=APPOINTMENT_STATUS_CHOICES, default='Requested')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Appointment for {self.patient.full_name} with Dr. {self.doctor.full_name} on {self.appointment_datetime.strftime('%Y-%m-%d %H:%M')}"

class Message(models.Model):
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username} at {self.sent_at.strftime('%H:%M')}"

class HealthMetric(models.Model):
    patient = models.ForeignKey(Patient, to_field='patient_id', on_delete=models.CASCADE)
    metric_type = models.CharField(max_length=50) # e.g., 'blood_pressure_systolic'
    value = models.CharField(max_length=50)
    unit = models.CharField(max_length=20, blank=True) # e.g., 'mmHg', 'kg'
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.metric_type} for {self.patient.full_name}: {self.value} {self.unit}"
    
class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation between {', '.join([user.username for user in self.participants.all()])}"

# Modify the existing Message model
class Message(models.Model):
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    # We remove the 'receiver' field as the conversation model handles this now.

    def __str__(self):
        return f"From {self.sender.username} at {self.sent_at.strftime('%H:%M')}"