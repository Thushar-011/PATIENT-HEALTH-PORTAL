# core/admin.py
from django.contrib import admin
from .models import (
    Patient,
    Doctor,
    EMR,
    Prescription,
    LabResult,
    Appointment,
    Message,
    HealthMetric
)

# Register all models to make them accessible in the admin panel
admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(EMR)
admin.site.register(Prescription)
admin.site.register(LabResult)
admin.site.register(Appointment)
admin.site.register(Message)
admin.site.register(HealthMetric)