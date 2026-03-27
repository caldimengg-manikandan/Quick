from rest_framework import serializers

from .models import Shift


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = ("id", "employee", "shift_start", "shift_end", "title", "notes", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        start = attrs.get("shift_start")
        end = attrs.get("shift_end")
        if start and end and end <= start:
            raise serializers.ValidationError({"shift_end": "Shift end must be after shift start."})
        return attrs
