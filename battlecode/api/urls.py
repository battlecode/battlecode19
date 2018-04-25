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
    path('league/', views.LeagueList.as_view(), name='league-list'),
    path('league/<int:pk>/', views.LeagueDetail.as_view(), name='league-detail'),
    path('<str:league>/team/', views.TeamListCreate.as_view(), name='team-list'),
    path('<str:league>/team/<int:pk>/', views.TeamDetail.as_view(), name='team-detail'),
    path('<str:league>/submission/', views.SubmissionListCreate.as_view(), name='submission-list'),
    path('<str:league>/submission/<int:pk>/', views.SubmissionDetail.as_view(), name='submission-detail'),
    path('<str:league>/scrimmage/', views.ScrimmageListCreate.as_view(), name='scrimmage-list'),
    path('<str:league>/scrimmage/<int:pk>/', views.ScrimmageDetail.as_view(), name='scrimmage-detail'),
    path('<str:league>/map/', views.MapList.as_view(), name='map-list'),
    path('<str:league>/map/<int:pk>/', views.MapDetail.as_view(), name='map-detail'),
    path('<str:league>/tournament/', views.TournamentList.as_view(), name='tournament-list'),
    path('<str:league>/tournament/<int:pk>/', views.TournamentDetail.as_view(), name='tournament-detail'),
    path('<str:league>/tournament/<int:pk>/bracket', views.BracketDetail.as_view(), name='bracket-detail'),
]
