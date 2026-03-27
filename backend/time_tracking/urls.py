from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminEmployeeTimeLogsView,
    BreakEndView,
    BreakStartView,
    ClockInView,
    ClockOutView,
    TimeLogViewSet,
    TimesheetView,
)

router = DefaultRouter()
router.register(r"logs", TimeLogViewSet, basename="time-log")

urlpatterns = [
    path("clock-in/", ClockInView.as_view(), name="clock-in"),
    path("clock-out/", ClockOutView.as_view(), name="clock-out"),
    path("break/start/", BreakStartView.as_view(), name="break-start"),
    path("break/end/", BreakEndView.as_view(), name="break-end"),
    path("timesheets/", TimesheetView.as_view(), name="timesheets"),
    path("admin/employees/<int:employee_id>/logs/", AdminEmployeeTimeLogsView.as_view(), name="admin-employee-logs"),
]

urlpatterns += router.urls
