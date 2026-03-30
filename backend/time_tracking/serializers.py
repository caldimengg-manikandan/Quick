from rest_framework import serializers

from .models import Break, TimeLog


class BreakSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Break
        fields = ("id", "break_start", "break_end", "duration_seconds", "created_at")
        read_only_fields = ("id", "created_at")

    def get_duration_seconds(self, obj):
        if not obj.break_end:
            return 0
        return int((obj.break_end - obj.break_start).total_seconds())


class TimeLogSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    employee = serializers.CharField(source="employee.id", read_only=True)
    breaks = BreakSerializer(many=True, read_only=True)
    worked_seconds = serializers.SerializerMethodField()
    worked_hours = serializers.SerializerMethodField()
    break_seconds = serializers.SerializerMethodField()

    class Meta:
        model = TimeLog
        fields = (
            "id",
            "employee",
            "work_date",
            "clock_in",
            "clock_in_lat",
            "clock_in_lon",
            "clock_in_address",
            "clock_in_notes",
            "clock_in_photo",
            "clock_out",
            "clock_out_lat",
            "clock_out_lon",
            "clock_out_address",
            "clock_out_notes",
            "clock_out_photo",
            "notes",
            "breaks",
            "break_seconds",
            "worked_seconds",
            "worked_hours",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_break_seconds(self, obj):
        return obj.break_seconds()

    def get_worked_seconds(self, obj):
        return obj.worked_seconds()

    def get_worked_hours(self, obj):
        return round(obj.worked_seconds() / 3600, 2)
