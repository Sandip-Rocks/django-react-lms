from django.contrib import admin
from .models import User, Profile

admin.site.register(User)

admin.site.register(Profile)


class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'image', 'full_name', 'country', 'date']


class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'full_name', 'otp']
