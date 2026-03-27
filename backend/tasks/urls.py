from django.urls import path

from .views import (
    AdminTaskListCreateView,
    AdminTaskDetailView,
    EmployeeTaskListView,
    EmployeeTaskActionView,
)

urlpatterns = [
    # Admin endpoints
    path("admin/",        AdminTaskListCreateView.as_view(), name="task-admin-list"),
    path("admin/<int:pk>/", AdminTaskDetailView.as_view(),  name="task-admin-detail"),

    # Employee endpoints
    path("my/",                              EmployeeTaskListView.as_view(),   name="task-my-list"),
    path("my/<int:pk>/<str:action>/",        EmployeeTaskActionView.as_view(), name="task-my-action"),
]
