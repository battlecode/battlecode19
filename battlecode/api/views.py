"""
The view that is returned in a request.
"""

from django.http import Http404
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, serializers, viewsets
from rest_framework.response import Response

from battlecode.api.serializers import *
from battlecode.api.permissions import *


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


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read only view set for user profiles.
    """
    queryset = UserProfile.objects.all().order_by('user_id')
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.AllowAny,)


class LeagueViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read only view set for leagues, lists ordered by end date.
    """
    queryset = League.objects.exclude(hidden=True).order_by('end_date')
    serializer_class = LeagueSerializer
    permission_classes = (permissions.AllowAny,)


class TeamListCreate(generics.ListCreateAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer


class TeamDetail(generics.RetrieveUpdateAPIView, serializers.HyperlinkedRelatedField):
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
