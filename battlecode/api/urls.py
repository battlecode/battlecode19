"""
Public endpoints.
"""

from django.urls import path

from . import views

urlpatterns = [
    path('user/', views.UserCreate.as_view(), name='user-create'),
    path('user/<int:pk>/', views.UserDetail.as_view(), name='user-detail'),
    path('user/profile/', views.UserProfileList.as_view(), name='userprofile-list'),
    path('user/profile/<int:pk>/', views.UserProfileDetail.as_view(), name='userprofile-detail'),
    path('team/', views.TeamListCreate.as_view(), name='team'),
]
