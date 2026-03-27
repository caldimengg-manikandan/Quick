from datetime import date, datetime, timedelta

from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from employees.models import Employee

from .models import Break, TimeLog
from .serializers import TimeLogSerializer


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def _get_employee_for_request(request, employee_id: str | None) -> Employee | None:
    if request.user.role == "admin" and employee_id:
        return Employee.objects.filter(id=employee_id).first()
    return Employee.objects.filter(user=request.user).first()


class TimeLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TimeLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = TimeLog.objects.select_related("employee", "employee__user").prefetch_related("breaks")
        if self.request.user.role == "admin":
            return qs.order_by("-clock_in")
        employee = Employee.objects.filter(user=self.request.user).first()
        if not employee:
            return qs.none()
        return qs.filter(employee=employee).order_by("-clock_in")


class ClockInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        employee = Employee.objects.filter(user=request.user).first()
        if not employee:
            return Response({"detail": "Employee profile not found."}, status=404)
        open_log = TimeLog.objects.filter(employee=employee, clock_out__isnull=True).first()
        if open_log:
            return Response({"detail": "Already clocked in."}, status=400)
        now = timezone.now()
        lat = request.data.get("lat")
        lon = request.data.get("lon")
        address = request.data.get("address", "")
        notes = request.data.get("notes", "")
        photo = request.FILES.get("photo")
        time_log = TimeLog.objects.create(
            employee=employee,
            work_date=timezone.localdate(),
            clock_in=now,
            clock_in_lat=lat,
            clock_in_lon=lon,
            clock_in_address=address,
            clock_in_notes=notes,
            clock_in_photo=photo
        )
        return Response(TimeLogSerializer(time_log).data, status=201)


class ClockOutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        employee = Employee.objects.filter(user=request.user).first()
        if not employee:
            return Response({"detail": "Employee profile not found."}, status=404)
        time_log = TimeLog.objects.filter(employee=employee, clock_out__isnull=True).order_by("-clock_in").first()
        if not time_log:
            return Response({"detail": "No open time log."}, status=400)
        open_break = Break.objects.filter(time_log=time_log, break_end__isnull=True).order_by("-break_start").first()
        if open_break:
            open_break.break_end = timezone.now()
            open_break.save(update_fields=["break_end"])
        time_log.clock_out = timezone.now()
        time_log.clock_out_lat = request.data.get("lat")
        time_log.clock_out_lon = request.data.get("lon")
        time_log.clock_out_address = request.data.get("address", "")
        time_log.clock_out_notes = request.data.get("notes", "")
        if "photo" in request.FILES:
            time_log.clock_out_photo = request.FILES["photo"]
        
        time_log.save(update_fields=["clock_out", "clock_out_lat", "clock_out_lon", "clock_out_address", "clock_out_notes", "clock_out_photo"])
        return Response(TimeLogSerializer(time_log).data)


class BreakStartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        employee = Employee.objects.filter(user=request.user).first()
        if not employee:
            return Response({"detail": "Employee profile not found."}, status=404)
        time_log = TimeLog.objects.filter(employee=employee, clock_out__isnull=True).order_by("-clock_in").first()
        if not time_log:
            return Response({"detail": "No open time log."}, status=400)
        open_break = Break.objects.filter(time_log=time_log, break_end__isnull=True).first()
        if open_break:
            return Response({"detail": "Break already started."}, status=400)
        Break.objects.create(time_log=time_log, break_start=timezone.now())
        time_log.refresh_from_db()
        return Response(TimeLogSerializer(time_log).data)


class BreakEndView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        employee = Employee.objects.filter(user=request.user).first()
        if not employee:
            return Response({"detail": "Employee profile not found."}, status=404)
        time_log = TimeLog.objects.filter(employee=employee, clock_out__isnull=True).order_by("-clock_in").first()
        if not time_log:
            return Response({"detail": "No open time log."}, status=400)
        open_break = Break.objects.filter(time_log=time_log, break_end__isnull=True).order_by("-break_start").first()
        if not open_break:
            return Response({"detail": "No open break."}, status=400)
        open_break.break_end = timezone.now()
        open_break.save(update_fields=["break_end"])
        time_log.refresh_from_db()
        return Response(TimeLogSerializer(time_log).data)


class TimesheetView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        employee = _get_employee_for_request(request, request.query_params.get("employee"))
        if not employee:
            # Admin user or user without an employee profile — return an empty valid response
            return Response({
                "employee": None,
                "range": {},
                "entries": [],
                "daily": [],
                "weekly": [],
                "totals": {"hours": 0, "daily_overtime_hours": 0, "weekly_overtime_hours": 0},
            })

        start = _parse_date(request.query_params.get("start")) or (timezone.localdate() - timedelta(days=7))
        end = _parse_date(request.query_params.get("end")) or timezone.localdate()

        qs = (
            TimeLog.objects.filter(employee=employee, work_date__gte=start, work_date__lte=end)
            .prefetch_related("breaks")
            .order_by("work_date", "clock_in")
        )

        entries = []
        daily_totals = {}
        for log in qs:
            worked_hours = log.worked_seconds() / 3600
            entries.append(
                {
                    "id": log.id,
                    "work_date": str(log.work_date),
                    "clock_in": log.clock_in,
                    "clock_in_lat": log.clock_in_lat,
                    "clock_in_lon": log.clock_in_lon,
                    "clock_in_address": log.clock_in_address,
                    "clock_in_notes": log.clock_in_notes,
                    "clock_in_photo": request.build_absolute_uri(log.clock_in_photo.url) if log.clock_in_photo else None,
                    "clock_out": log.clock_out,
                    "clock_out_lat": log.clock_out_lat,
                    "clock_out_lon": log.clock_out_lon,
                    "clock_out_address": log.clock_out_address,
                    "clock_out_notes": log.clock_out_notes,
                    "clock_out_photo": request.build_absolute_uri(log.clock_out_photo.url) if log.clock_out_photo else None,
                    "break_seconds": log.break_seconds(),
                    "worked_hours": round(worked_hours, 2),
                }
            )
            daily_totals.setdefault(log.work_date, 0.0)
            daily_totals[log.work_date] += worked_hours

        daily = []
        total_hours = 0.0
        daily_overtime = 0.0
        for d, hours in sorted(daily_totals.items(), key=lambda x: x[0]):
            ot = max(0.0, hours - 8.0)
            daily.append({"date": str(d), "hours": round(hours, 2), "overtime_hours": round(ot, 2)})
            total_hours += hours
            daily_overtime += ot

        weekly_hours = {}
        for d, hours in daily_totals.items():
            y, w, _ = d.isocalendar()
            weekly_hours.setdefault((y, w), 0.0)
            weekly_hours[(y, w)] += hours

        weekly = []
        weekly_overtime = 0.0
        for (y, w), hours in sorted(weekly_hours.items()):
            ot = max(0.0, hours - 40.0)
            weekly.append({"iso_year": y, "iso_week": w, "hours": round(hours, 2), "overtime_hours": round(ot, 2)})
            weekly_overtime += ot

        return Response(
            {
                "employee": {"id": employee.id, "employee_id": employee.employee_id},
                "range": {"start": str(start), "end": str(end)},
                "entries": entries,
                "daily": daily,
                "weekly": weekly,
                "totals": {
                    "hours": round(total_hours, 2),
                    "daily_overtime_hours": round(daily_overtime, 2),
                    "weekly_overtime_hours": round(weekly_overtime, 2),
                },
            }
        )


class AdminEmployeeTimeLogsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request, employee_id: int):
        employee = Employee.objects.filter(id=employee_id).first()
        if not employee:
            return Response({"detail": "Employee profile not found."}, status=404)
        qs = TimeLog.objects.filter(employee=employee).prefetch_related("breaks").order_by("-clock_in")
        return Response(TimeLogSerializer(qs, many=True).data)
