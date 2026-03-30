from rest_framework import serializers

from accounts.models import User
from .models import Task


class AssignedToSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model  = User
        fields = ("id", "username", "first_name", "last_name")


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
        pk_field=serializers.CharField()
    )
    assigned_by = serializers.PrimaryKeyRelatedField(
        read_only=True,
        pk_field=serializers.CharField()
    )
    
    assigned_to_detail = AssignedToSerializer(source="assigned_to", read_only=True)
    assigned_by_name = serializers.SerializerMethodField()
    actual_hours = serializers.ReadOnlyField()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Ensure MongoDB ObjectIds are cast to strings for JSON
        if ret.get('id'): ret['id'] = str(ret['id'])
        if ret.get('assigned_to'): ret['assigned_to'] = str(ret['assigned_to'])
        if ret.get('assigned_by'): ret['assigned_by'] = str(ret['assigned_by'])
        return ret

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
