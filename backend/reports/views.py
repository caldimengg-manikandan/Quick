from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from employees.models import Employee
from leaves.models import LeaveRequest
from payroll.models import PayrollRecord
from time_tracking.models import TimeLog


def _parse_date(value: str | None):
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


class AdminOverviewReportView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        start = _parse_date(request.query_params.get("start")) or (timezone.localdate() - timedelta(days=30))
        end = _parse_date(request.query_params.get("end")) or timezone.localdate()

        employees_total = Employee.objects.count()
        employees_active = Employee.objects.filter(is_active=True).count()

        leaves_pending = LeaveRequest.objects.filter(status=LeaveRequest.Status.PENDING).count()
        leaves_approved_range = LeaveRequest.objects.filter(
            status=LeaveRequest.Status.APPROVED, start_date__lte=end, end_date__gte=start
        ).count()

        time_logs_range = TimeLog.objects.filter(work_date__gte=start, work_date__lte=end).count()
        payroll_generated_range = PayrollRecord.objects.filter(period__start_date__gte=start, period__end_date__lte=end).count()

        return Response(
            {
                "range": {"start": str(start), "end": str(end)},
                "employees": {"total": employees_total, "active": employees_active},
                "leaves": {"pending": leaves_pending, "approved_in_range": leaves_approved_range},
                "time_tracking": {"time_logs_in_range": time_logs_range},
                "payroll": {"records_generated_in_range": payroll_generated_range},
            }
        )
