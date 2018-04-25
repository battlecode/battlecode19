"""
The view that is returned in a request.
"""

from django.http import Http404
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .serializers import *
from .permissions import *


class UserCreate(generics.CreateAPIView):
    """
    Create a new user.
    """
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)


class UserDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or destroy the currently authenticated user.
    """
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticatedAsRequestedUser,)


class UserProfileList(generics.ListAPIView):
    """
    Retrieves a list of public profiles of users.
    """
    queryset = UserProfile.objects.all().order_by('user_id')
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.AllowAny,)


class UserProfileDetail(generics.RetrieveAPIView):
    """
    Retrieves the public profile of a user.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.AllowAny,)


class LeagueList(generics.ListAPIView):
    queryset = League.objects.all()
    serializer_class = LeagueSerializer


class LeagueDetail(generics.RetrieveAPIView):
    queryset = League.objects.all()
    serializer_class = LeagueSerializer


class TeamListCreate(generics.ListCreateAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer


class TeamDetail(generics.RetrieveUpdateAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer


class SubmissionListCreate(generics.ListCreateAPIView):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer


class SubmissionDetail(generics.RetrieveAPIView):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer


class ScrimmageListCreate(generics.ListCreateAPIView):
    queryset = Scrimmage.objects.all()
    serializer_class = ScrimmageSerializer


class ScrimmageDetail(generics.RetrieveAPIView):
    queryset = Scrimmage.objects.all()
    serializer_class = ScrimmageSerializer


class MapList(generics.ListAPIView):
    queryset = Map.objects.all()
    serializer_class = MapSerializer


class MapDetail(generics.RetrieveAPIView):
    queryset = Map.objects.all()
    serializer_class = MapSerializer


class TournamentList(generics.ListAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer


class TournamentDetail(generics.RetrieveAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer


class BracketDetail(generics.RetrieveAPIView):
    queryset = TournamentScrimmage.objects.all()
    serializer_class = TournamentScrimmageSerializer
