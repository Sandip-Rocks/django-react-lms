import random
from django.shortcuts import render
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

from api import serializers as api_serializers
from userauths.models import User

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = api_serializers.MyTokenobtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = api_serializers.RegisterSerializer


def generate_random_otp(length=7):
    otp = ''.join([str(random.randint(0, 9)) for _ in range(length)])
    return otp


class PasswordResetEmailVerifyAPIView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = api_serializers.UserSerializers

    def get_object(self):
        email = self.kwargs['email']
        user = User.objects.filter(email=email).first()

        if user:
            uuidb64 = user.pk
            refresh = RefreshToken.for_user(user)
            refresh_token = str(refresh.access_token)
            user.refesh_token = refresh_token
            user.otp = generate_random_otp()
            user.save()
            link = f"http://localhost:5173/create-new-password/?otp={user.otp}&uuidb64={uuidb64}&refresh_token={refresh_token}"
            context = {
                "link": link,
                "username": user.username
            }
            html_body = render_to_string("email/password_reset.html", context)
            send_mail(
                subject="Password Reset Email",
                message=html_body,
                from_email=settings.FROM_EMAIL,
                recipient_list=[user.email]
            )
        return user


class PasswordChanegeAPIView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = api_serializers.UserSerializers

    def create(self, request, *args, **kwargs):
        payload = request.data
        otp = payload['otp']
        uuidb64 = payload['uuidb64']
        password = payload['password']

        user = user.objects.get(id=uuidb64, otp=otp)
        if user:
            user.set_password(password)
            user.otp = ''
            user.save()
            return Response({"message": "Password changed successfully"}, status=status.HTTP_201_CREATED)
        else:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
