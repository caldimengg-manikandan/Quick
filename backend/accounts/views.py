from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
import requests
from django.contrib.auth import get_user_model

from .serializers import UserSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = str(user.role)
        token["username"] = str(user.username)
        return token


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    pass


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        access_token = request.data.get("access_token")
        if not access_token:
            return Response({"detail": "Missing Google access token"}, status=status.HTTP_400_BAD_REQUEST)
        
        response = requests.get(f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={access_token}")
        if not response.ok:
            return Response({"detail": "Invalid Google access token"}, status=status.HTTP_400_BAD_REQUEST)
        
        user_info = response.json()
        email = user_info.get("email")
        if not email:
            return Response({"detail": "No email provided by Google"}, status=status.HTTP_400_BAD_REQUEST)
            
        User = get_user_model()
        user = User.objects.filter(email=email).first()
        if not user:
            username = email.split("@")[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User.objects.create(
                username=username,
                email=email,
                first_name=user_info.get("given_name", ""),
                last_name=user_info.get("family_name", ""),
            )
            user.set_unusable_password()
            user.save()
            
            # Auto-create Employee profile to prevent Time Tracker error
            from employees.models import Employee
            Employee.objects.get_or_create(
                user=user,
                defaults={
                    "employee_id": f"EMP-{str(user.id)[:10]}",
                    "title": "Staff",
                    "hourly_rate": 0,
                }
            )
            
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email", "")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")
        role = request.data.get("role", "employee")

        if not username or not password:
            return Response({"detail": "Username and password required."}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        if User.objects.filter(username=username).exists():
            return Response({"detail": "Username is already taken."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role if role in ["admin", "employee"] else "employee"
        )

        # Create Profile
        from employees.models import Employee
        Employee.objects.get_or_create(
            user=user,
            defaults={
                "employee_id": f"EMP-{str(user.id)[:8].upper()}",
                "title": "New Hire",
                "hourly_rate": 0,
            }
        )

        refresh = CustomTokenObtainPairSerializer.get_token(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
