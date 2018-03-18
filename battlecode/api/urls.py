from django.urls import path, include
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'groups', views.GroupViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.create_user, name='register'),
    path('teams/', views.TeamListCreate.as_view(), name='teams'),
]
