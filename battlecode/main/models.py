from django.conf import settings
from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user             = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    birth_date       = models.DateField()
    registration_key = models.CharField(max_length=32, null=True, unique=True)
    bio              = models.CharField(max_length=10000, blank=True)
    avatar           = models.TextField(blank=True)
