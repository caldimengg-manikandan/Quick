from rest_framework import serializers

from .models import PayrollPeriod, PayrollRecord


class PayrollPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollPeriod
        fields = ("id", "start_date", "end_date", "created_at")
        read_only_fields = ("id", "created_at")


class PayrollRecordSerializer(serializers.ModelSerializer):
    period = PayrollPeriodSerializer(read_only=True)

    class Meta:
        model = PayrollRecord
        fields = (
            "id",
            "period",
            "employee",
            "hourly_rate",
            "regular_hours",
            "overtime_hours",
            "paid_leave_hours",
            "unpaid_leave_hours",
            "gross_pay",
            "net_pay",
            "generated_by",
            "generated_at",
        )
        read_only_fields = ("id", "gross_pay", "net_pay", "generated_by", "generated_at")


class PayrollGenerateSerializer(serializers.Serializer):
    employee = serializers.IntegerField()
    start = serializers.DateField()
    end = serializers.DateField()
