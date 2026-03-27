from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task
from .serializers import TaskSerializer, TaskStatusUpdateSerializer


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "admin"


# ── Admin: full CRUD ──────────────────────────────────────────

class AdminTaskListCreateView(APIView):
    """
    GET  /api/tasks/admin/          → list all tasks (admin)
    POST /api/tasks/admin/          → create & assign a task (admin)
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = Task.objects.select_related("assigned_to", "assigned_by").all()

        # Optional filters
        employee_id = request.query_params.get("employee")
        status_f    = request.query_params.get("status")
        due_date    = request.query_params.get("due_date")

        if employee_id:
            qs = qs.filter(assigned_to_id=employee_id)
        if status_f:
            qs = qs.filter(status=status_f)
        if due_date:
            qs = qs.filter(due_date=due_date)

        return Response(TaskSerializer(qs, many=True).data)

    def post(self, request):
        ser = TaskSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        task = ser.save(assigned_by=request.user)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


class AdminTaskDetailView(APIView):
    """
    GET    /api/tasks/admin/<pk>/   → retrieve
    PATCH  /api/tasks/admin/<pk>/   → update
    DELETE /api/tasks/admin/<pk>/   → delete
    """
    permission_classes = [IsAdmin]

    def get_object(self, pk):
        try:
            return Task.objects.select_related("assigned_to", "assigned_by").get(pk=pk)
        except Task.DoesNotExist:
            return None

    def get(self, request, pk):
        task = self.get_object(pk)
        if not task:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(TaskSerializer(task).data)

    def patch(self, request, pk):
        task = self.get_object(pk)
        if not task:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ser = TaskSerializer(task, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(TaskSerializer(task).data)

    def delete(self, request, pk):
        task = self.get_object(pk)
        if not task:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Employee: own tasks ───────────────────────────────────────

class EmployeeTaskListView(APIView):
    """
    GET /api/tasks/my/              → list tasks assigned to current user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Task.objects.filter(assigned_to=request.user).select_related("assigned_by")
        status_f = request.query_params.get("status")
        if status_f:
            qs = qs.filter(status=status_f)
        return Response(TaskSerializer(qs, many=True).data)


class EmployeeTaskActionView(APIView):
    """
    PATCH /api/tasks/my/<pk>/start/     → mark In Progress (records started_at)
    PATCH /api/tasks/my/<pk>/complete/  → mark Completed   (records completed_at)
    PATCH /api/tasks/my/<pk>/notes/     → update employee notes / status
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Task.objects.get(pk=pk, assigned_to=user)
        except Task.DoesNotExist:
            return None

    def patch(self, request, pk, action):
        task = self.get_object(pk, request.user)
        if not task:
            return Response({"detail": "Not found or not assigned to you."}, status=status.HTTP_404_NOT_FOUND)

        if action == "start":
            if task.status == Task.Status.PENDING:
                task.status     = Task.Status.IN_PROGRESS
                task.started_at = timezone.now()
                task.save(update_fields=["status", "started_at"])
        elif action == "complete":
            if task.status in (Task.Status.PENDING, Task.Status.IN_PROGRESS):
                task.status       = Task.Status.COMPLETED
                task.completed_at = timezone.now()
                if not task.started_at:
                    task.started_at = task.completed_at
                task.save(update_fields=["status", "completed_at", "started_at"])
        elif action == "notes":
            ser = TaskStatusUpdateSerializer(task, data=request.data, partial=True)
            ser.is_valid(raise_exception=True)
            ser.save()
        else:
            return Response({"detail": f"Unknown action: {action}"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(TaskSerializer(task).data)
