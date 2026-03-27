from rest_framework import serializers

from accounts.models import User
from .models import Task


class AssignedToSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ("id", "username", "first_name", "last_name")


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_detail = AssignedToSerializer(source="assigned_to", read_only=True)
    assigned_by_name   = serializers.SerializerMethodField()
    actual_hours       = serializers.ReadOnlyField()

    class Meta:
        model  = Task
        fields = (
            "id",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "assigned_to",
            "assigned_to_detail",
            "assigned_by",
            "assigned_by_name",
            "due_date",
            "estimated_hours",
            "actual_hours",
            "location",
            "location_lat",
            "location_lon",
            "employee_notes",
            "admin_notes",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "assigned_by", "started_at", "completed_at", "created_at", "updated_at")

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.get_full_name() or obj.assigned_by.username
        return ""


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    """Minimal serializer for employee status updates."""
    class Meta:
        model  = Task
        fields = ("status", "employee_notes")
