# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterUserView,
    PatientProfileCreateView,
    DoctorProfileCreateView,
    PatientViewSet,
    DoctorViewSet,
    AppointmentViewSet,
    EMRViewSet,
    PrescriptionViewSet,
    HealthMetricViewSet,
    ConversationViewSet,
    MessageListView,
    download_prescription_pdf,
    UserProfileView,
    PatientListViewForDoctors
)

# The router automatically generates URL patterns for ViewSets.
router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'emrs', EMRViewSet, basename='emr')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'healthmetrics', HealthMetricViewSet, basename='healthmetric')
# Register the new ConversationViewSet
router.register(r'conversations', ConversationViewSet, basename='conversation')


# The urlpatterns list routes URLs to views.
urlpatterns = [
    # ADD THIS LINE FOR REGISTRATION
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('register/', RegisterUserView.as_view(), name='register'),
    # These are for creating profiles AFTER registration
    path('profiles/patient/', PatientProfileCreateView.as_view(), name='create-patient-profile'),
    path('profiles/doctor/', DoctorProfileCreateView.as_view(), name='create-doctor-profile'),
    path('doctor/patients/', PatientListViewForDoctors.as_view(), name='doctor-patient-list'),
    # URLs from the router and other features
    path('', include(router.urls)),
    path('conversations/<int:conversation_id>/messages/', MessageListView.as_view(), name='conversation-messages'),
    path('prescriptions/<int:prescription_id>/download/', download_prescription_pdf, name='download-prescription'),
]