# core/views.py
from rest_framework import status, viewsets, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from .models import Prescription
from rest_framework.views import APIView
from .permissions import IsDoctorUser
import io

# Import your models, serializers, and new permissions
from .models import (
    Patient, Doctor, EMR, Prescription, LabResult, Appointment, Message, HealthMetric, Conversation
)
from .serializers import (
    PatientSerializer, DoctorSerializer, EMRSerializer, PrescriptionSerializer,
    LabResultSerializer, AppointmentSerializer, MessageSerializer, HealthMetricSerializer, ConversationSerializer
)
from .permissions import IsPatientOwner, IsDoctorOrReadOnly, IsRelatedPatientOrDoctor

# --- Authentication and Profile Creation Views ---

class RegisterUserView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        # ... (This view remains the same as before)
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not email or not password:
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()

        return Response({"message": "User registered successfully. Please create your profile."}, status=status.HTTP_201_CREATED)

class PatientProfileCreateView(generics.CreateAPIView):
    """
    Endpoint for a newly registered user to create their Patient profile.
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Check if the user already has a patient or doctor profile
        if hasattr(self.request.user, 'patient') or hasattr(self.request.user, 'doctor'):
            from rest_framework.exceptions import ValidationError
            raise ValidationError("A profile already exists for this user.")
        # Link the new patient profile to the currently authenticated user
        serializer.save(user=self.request.user)

class DoctorProfileCreateView(generics.CreateAPIView):
    """
    Endpoint for a newly registered user to create their Doctor profile.
    """
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated] # In a real app, this might be IsAdminUser

    def perform_create(self, serializer):
        # Check if the user already has a patient or doctor profile
        if hasattr(self.request.user, 'patient') or hasattr(self.request.user, 'doctor'):
            from rest_framework.exceptions import ValidationError
            raise ValidationError("A profile already exists for this user.")
        # Link the new doctor profile to the currently authenticated user
        serializer.save(user=self.request.user)


# --- Updated Model ViewSets with Logic and Permissions ---

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated, IsPatientOwner]
    lookup_field = 'patient_id' # Important!

    def get_queryset(self):
        # A user can only see their own patient profile
        return Patient.objects.filter(user=self.request.user)

class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Doctors' profiles are read-only for patients.
    Only an admin could edit them (not implemented here for simplicity).
    """
    queryset = Doctor.objects.all()
    squeryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'doctor_id' # Important!

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated, IsRelatedPatientOrDoctor]

    def get_queryset(self):
        # Return appointments relevant to the logged-in user
        user = self.request.user
        if hasattr(user, 'patient'):
            return Appointment.objects.filter(patient=user.patient)
        if hasattr(user, 'doctor'):
            return Appointment.objects.filter(doctor=user.doctor)
        return Appointment.objects.none() # No profile, no appointments

    def perform_create(self, serializer):
        # When a patient creates an appointment, assign them automatically
        if hasattr(self.request.user, 'patient'):
            serializer.save(patient=self.request.user.patient)
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only patients can create appointments.")

# Similar logic for EMRs, Prescriptions, etc.
class EMRViewSet(viewsets.ModelViewSet):
    serializer_class = EMRSerializer
    permission_classes = [IsAuthenticated, IsRelatedPatientOrDoctor]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'patient'):
            return EMR.objects.filter(patient=user.patient)
        if hasattr(user, 'doctor'):
            return EMR.objects.filter(doctor=user.doctor)
        return EMR.objects.none()

    def perform_create(self, serializer):
        # Only doctors can create EMRs
        if hasattr(self.request.user, 'doctor'):
            serializer.save(doctor=self.request.user.doctor)
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only doctors can create EMRs.")

# ... And so on for other models ...
class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated] # We will handle permissions in get_queryset

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'patient'):
            return Prescription.objects.filter(patient=user.patient).order_by('-created_at')
        if hasattr(user, 'doctor'):
            return Prescription.objects.filter(doctor=user.doctor).order_by('-created_at')
        return Prescription.objects.none()

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'doctor'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only doctors can create prescriptions.")
        # Automatically assign the logged-in doctor
        serializer.save(doctor=self.request.user.doctor)

def download_prescription_pdf(request, prescription_id):
    # Security check: Ensure the user (patient) has access to this prescription
    user = request.user
    try:
        prescription = Prescription.objects.get(id=prescription_id)
        # Check if the user is the patient for this prescription
        if not hasattr(user, 'patient') or prescription.emr.patient != user.patient:
            return HttpResponse("Unauthorized", status=403)
    except Prescription.DoesNotExist:
        return HttpResponse("Not Found", status=404)

    # Create a file-like buffer to receive PDF data.
    buffer = io.BytesIO()

    # Create the PDF object, using the buffer as its "file."
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Draw things on the PDF.
    p.drawString(inch, height - inch, f"Prescription for: {prescription.emr.patient.full_name}")
    p.drawString(inch, height - 1.25 * inch, f"Prescribed by: Dr. {prescription.emr.doctor.full_name}")
    p.drawString(inch, height - 1.5 * inch, f"Date: {prescription.refill_date or 'N/A'}")
    p.line(inch, height - 1.6 * inch, width - inch, height - 1.6 * inch)

    p.drawString(inch, height - 2 * inch, f"Medication: {prescription.medication_name}")
    p.drawString(inch, height - 2.25 * inch, f"Dosage: {prescription.dosage}")
    p.drawString(inch, height - 2.5 * inch, f"Instructions: {prescription.instructions}")

    # Close the PDF object cleanly, and we're done.
    p.showPage()
    p.save()

    # FileResponse sets the Content-Disposition header so that browsers
    # present the option to save the file.
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="prescription_{prescription.id}.pdf"'
    return response


# class MessageViewSet(viewsets.ModelViewSet):
#     serializer_class = MessageSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         # Users can only see messages they sent or received
#         user = self.request.user
#         from django.db.models import Q
#         return Message.objects.filter(Q(sender=user) | Q(receiver=user))

#     def perform_create(self, serializer):
#         # Set the sender to the current user automatically
#         serializer.save(sender=self.request.user)

class HealthMetricViewSet(viewsets.ModelViewSet):
    serializer_class = HealthMetricSerializer
    permission_classes = [IsAuthenticated] # Needs custom permissions like IsRelatedPatientOrDoctor

    def get_queryset(self):
        # Implement filtering logic for patients/doctors
        return HealthMetric.objects.all() # Placeholder
    
class ConversationViewSet(viewsets.ModelViewSet):
    """
    Handles listing conversations and creating new ones.
    """
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return conversations the user is a part of
        return self.request.user.conversations.all().order_by('-updated_at')

    def perform_create(self, serializer):
        # When creating, the request data should include a 'participants' list of user IDs.
        participants_data = self.request.data.get('participants', [])
        participants = [self.request.user] + [User.objects.get(id=user_id) for user_id in participants_data]
        # Prevent duplicate conversations
        # This logic can be improved for larger scale apps
        # For now, we assume a simple creation
        serializer.save(participants=participants)

class MessageListView(generics.ListCreateAPIView):
    """
    Handles messages within a specific conversation.
    """
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        # Ensure the user is part of this conversation before showing messages
        if self.request.user.conversations.filter(id=conversation_id).exists():
            return Message.objects.filter(conversation_id=conversation_id).order_by('sent_at')
        return Message.objects.none()

    def perform_create(self, serializer):
        conversation_id = self.kwargs['conversation_id']
        conversation = Conversation.objects.get(id=conversation_id)
        # Ensure sender is the current user
        serializer.save(sender=self.request.user, conversation=conversation)

class UserProfileView(APIView):
    """
    Returns the profile type for the currently authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if hasattr(user, 'patient'):
            return Response({'has_profile': True, 'role': 'patient'})
        elif hasattr(user, 'doctor'):
            return Response({'has_profile': True, 'role': 'doctor'})
        else:
            return Response({'has_profile': False, 'role': None})
        
class PatientListViewForDoctors(generics.ListAPIView):
    """
    Provides a read-only list of all patients for authenticated doctors.
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated, IsDoctorUser]