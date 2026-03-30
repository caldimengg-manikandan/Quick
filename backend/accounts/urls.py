from django.urls import path

from .views import LoginView, MeView, RefreshView, GoogleLoginView

urlpatterns = [
    path("login/", LoginView.as_view(), name="jwt-login"),
    path("google/", GoogleLoginView.as_view(), name="google-login"),
    path("refresh/", RefreshView.as_view(), name="jwt-refresh"),
    path("me/", MeView.as_view(), name="me"),
]
