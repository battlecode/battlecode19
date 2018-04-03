from django.urls import path

from . import views

urlpatterns = [
    path('user/<int:pk>/', views.UserDetail.as_view(), name='user-detail'),
    path('user/', views.UserCreate.as_view(), name='user-create'),
    path('team/', views.TeamListCreate.as_view(), name='team'),
]
