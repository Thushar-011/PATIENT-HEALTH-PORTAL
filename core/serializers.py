# core/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Patient,
    Doctor,
    EMR,
    Prescription,
    LabResult,
    Appointment,
    Message,
    HealthMetric,
    Conversation
)

# Serializer for the base User model (for context in other serializers)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

# Model Serializers
class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ('user', 'patient_id')
        lookup_field = 'patient_id' # Tell DRF to use this for URLs

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'
        read_only_fields = ('user', 'doctor_id')
        lookup_field = 'doctor_id' # Tell DRF to use this for URLs

class EMRSerializer(serializers.ModelSerializer):
    class Meta:
        model = EMR
        fields = '__all__'

class PrescriptionSerializer(serializers.ModelSerializer):
    # Explicitly define the patient field to accept the patient_id
    patient = serializers.SlugRelatedField(
        slug_field='patient_id',
        queryset=Patient.objects.all()
    )
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'medication_name', 'dosage', 'instructions', 'created_at'
        ]
        read_only_fields = ('doctor', 'doctor_name', 'patient_name')

class LabResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabResult
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'appointment_datetime', 'status', 'notes', 'created_at']
        read_only_fields = ('patient',)

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_username', 'message', 'sent_at']
        # ADD 'conversation' TO THE LINE BELOW
        read_only_fields = ['sender', 'conversation']

class HealthMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthMetric
        fields = '__all__'

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'updated_at']
