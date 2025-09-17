# core/permissions.py
from rest_framework import permissions
from .models import Patient, Doctor

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return obj.user == request.user

class IsPatientOwner(permissions.BasePermission):
    """
    Allows access only to the patient who owns the profile.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class IsDoctorOrReadOnly(permissions.BasePermission):
    """
    Allows doctors to perform actions, otherwise read-only.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, 'doctor')

class IsRelatedPatientOrDoctor(permissions.BasePermission):
    """
    Permission to only allow a related patient or doctor to view an object.
    For objects like Appointments, EMRs, etc.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        # The object must have a 'patient' attribute
        if hasattr(obj, 'patient'):
            # If the user is a patient, they must be the patient on the object.
            if hasattr(user, 'patient') and obj.patient == user.patient:
                return True
            # If the user is a doctor, they must be the doctor on the object.
            if hasattr(user, 'doctor') and hasattr(obj, 'doctor') and obj.doctor == user.doctor:
                return True
        return False

class IsDoctorUser(permissions.BasePermission):
    """
    Allows access only to users with a doctor profile.
    """
    def has_permission(self, request, view):
        return hasattr(request.user, 'doctor')