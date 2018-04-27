"""
Public endpoints.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('user/profile', views.UserProfileViewSet, base_name='userprofile')
router.register('league', views.LeagueViewSet, base_name='league')
router.register('(?P<league_id>[^/.]+)/team', views.TeamViewSet, base_name='team')

urlpatterns = router.urls
urlpatterns.extend([
    path('user/', views.UserCreate.as_view(), name='user-create'),
    path('user/<int:pk>/', views.UserDetail.as_view(), name='user-detail'),
    path('<str:league_id>/submission/', views.SubmissionListCreate.as_view(), name='submission-list'),
    path('<str:league_id>/submission/<int:pk>/', views.SubmissionDetail.as_view(), name='submission-detail'),
    path('<str:league_id>/scrimmage/', views.ScrimmageListCreate.as_view(), name='scrimmage-list'),
    path('<str:league_id>/scrimmage/<int:pk>/', views.ScrimmageDetail.as_view(), name='scrimmage-detail'),
    path('<str:league_id>/map/', views.MapList.as_view(), name='map-list'),
    path('<str:league_id>/map/<int:pk>/', views.MapDetail.as_view(), name='map-detail'),
    path('<str:league_id>/tournament/', views.TournamentList.as_view(), name='tournament-list'),
    path('<str:league_id>/tournament/<int:pk>/', views.TournamentDetail.as_view(), name='tournament-detail'),
    path('<str:league_id>/tournament/<int:pk>/bracket', views.BracketDetail.as_view(), name='bracket-detail'),
])
