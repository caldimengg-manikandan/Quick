from django.urls import path

from .views import AdminOverviewReportView

urlpatterns = [
    path("overview/", AdminOverviewReportView.as_view(), name="reports-overview"),
]
