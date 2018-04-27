"""
The view that is returned in a request.
"""

from django.http import Http404
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, mixins, viewsets
from rest_framework.response import Response

from battlecode.api.serializers import *
from battlecode.api.permissions import *


class PartialUpdateModelMixin(mixins.UpdateModelMixin):
    def update(self, request, partial=False, league_id=None, pk=None):
        if request.method == 'PUT':
            return Response({}, status.HTTP_405_METHOD_NOT_ALLOWED)
        return super().update(request, partial=partial, pk=pk)


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


def validate_league(league_id):
    league = League.objects.get(pk=league_id, hidden=False)
    if league is None:
        return Response({'message': 'League "{}" not found'.format(league)}, status.HTTP_404_NOT_FOUND)
    if not league.active:
        return Response({'message': 'League "{}" not active'.format(league)}, status.HTTP_400_BAD_REQUEST)


class TeamViewSet(viewsets.GenericViewSet,
                  mixins.CreateModelMixin,
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  PartialUpdateModelMixin):
    queryset = Team.objects.all().order_by('name').exclude(deleted=True)
    serializer_class = TeamSerializer
    permission_classes = (IsAuthenticatedOrUnsafeMethods,)

    def get_queryset(self):
        return super().get_queryset().filter(league_id=self.kwargs['league_id'])

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    def create(self, request, league_id):
        """
        Validates the request to make sure the user is not already on a team in this league.
        Creates a team in this league, where the authenticated user is the first to join the team.
        """
        err = validate_league(league_id)
        if err: return err

        name = request.data.get('name', None)
        if name is None:
            return Response({'message': 'Team name required'}, status.HTTP_400_BAD_REQUEST)

        if len(self.get_queryset().filter(users__contains=[request.user.id])) > 0:
            return Response({'message': 'Already on a team in this league'}, status.HTTP_400_BAD_REQUEST)
        if len(self.get_queryset().filter(name=name)) > 0:
            return Response({'message': 'Team with this name already exists'}, status.HTTP_400_BAD_REQUEST)

        try:
            team = {}
            team['league'] = league_id
            team['name'] = request.data.get('name', None)
            team['users'] = [request.user.id]

            serializer = self.get_serializer(data=team)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status.HTTP_201_CREATED)
            return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            error = {'message': ','.join(e.args) if len(e.args) > 0 else 'Unknown Error'}
            return Response(error, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, league_id, pk=None):
        """
        Retrieves an active team in the league. Also gets the team key if the authenticated user is on this team.
        """
        err = validate_league(league_id)
        if err: return err

        res = super().retrieve(request, pk=pk)
        # from nose.tools import set_trace; set_trace()
        if res.status_code == status.HTTP_200_OK and request.user.id in res.data.get('users'):
            res.data['team_key'] = self.get_queryset().get(pk=pk).team_key
        return res

    def partial_update(self, request, league_id, pk=None):
        """
        Updates the team. The authenticated user must be on the team to leave or update it.

        Includes the following operations:
        "join" - Joins the team. Fails if the team has the maximum number of members, or if the team key is incorrect.
        "leave" - Leaves the team. Deletes the team if this is the last user to leave the team.
        "update" - Updates the team bio, divisions, or auto-accepting for ranked and unranked scrimmages.
        """
        err = validate_league(league_id)
        if err: return err

        try:
            team = self.get_queryset().get(pk=pk)
        except Team.DoesNotExist:
            return Response({'message': 'Team not found'}, status.HTTP_404_NOT_FOUND)

        op = request.data.get('op', None)
        if op not in ['join', 'leave', 'update']:
            return Response({'message': 'Invalid op: "join", "leave", "update"'}, status.HTTP_400_BAD_REQUEST)

        if op == 'join':
            if len(self.get_queryset().filter(users__contains=[request.user.id])) > 0:
                return Response({'message': 'Already on a team in this league'}, status.HTTP_400_BAD_REQUEST)
            if team.team_key != request.data.get('team_key', None):
                return Response({'message': 'Invalid team key'}, status.HTTP_400_BAD_REQUEST)
            if len(team.users) == 4:
                return Response({'message': 'Team has max number of users'}, status.HTTP_400_BAD_REQUEST)
            team.users.append(request.user.id)
            team.save()

            serializer = self.get_serializer(team)
            return Response(serializer.data, status.HTTP_200_OK)

        if request.user.id not in team.users:
            return Response({'message': 'User not on this team'}, status.HTTP_401_UNAUTHORIZED)

        if op == 'leave':
            team.users.remove(request.user.id)
            team.deleted = len(team.users) == 0
            team.save()

            serializer = self.get_serializer(team)
            return Response(serializer.data, status.HTTP_200_OK)

        return super().partial_update(request)


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
