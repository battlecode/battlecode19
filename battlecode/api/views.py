"""
The view that is returned in a request.
"""

from django.http import Http404, HttpResponseForbidden
from django.core.exceptions import PermissionDenied
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


class UserViewSet(viewsets.GenericViewSet,
                  mixins.CreateModelMixin,
                  mixins.RetrieveModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.DestroyModelMixin):
    """
    Anyone is permitted to create a user.
    An authenticated user can retrieve, update, or destroy themself.
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
    queryset = League.objects.order_by('end_date')
    serializer_class = LeagueSerializer
    permission_classes = (permissions.AllowAny,)


class TeamViewSet(viewsets.GenericViewSet,
                  mixins.CreateModelMixin,
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  PartialUpdateModelMixin):
    queryset = Team.objects.all().order_by('name').exclude(deleted=True)
    serializer_class = TeamSerializer

    def get_permissions(self):
        league = League.objects.get(pk=self.kwargs.get('league_id'))
        if league is None:
            raise PermissionDenied
        if self.request.method not in permissions.SAFE_METHODS and not league.active:
            raise PermissionDenied
        return [IsAuthenticatedOrSafeMethods()]

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
        res = super().retrieve(request, pk=pk)
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


class SubmissionViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.CreateModelMixin,
                        mixins.RetrieveModelMixin):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer


class ScrimmageViewSet(viewsets.GenericViewSet,
                       mixins.ListModelMixin,
                       mixins.CreateModelMixin,
                       mixins.RetrieveModelMixin,
                       mixins.UpdateModelMixin):
    queryset = Scrimmage.objects.all()
    serializer_class = ScrimmageSerializer


class MapViewSet(viewsets.GenericViewSet,
                 mixins.ListModelMixin,
                 mixins.RetrieveModelMixin):
    queryset = Map.objects.all()
    serializer_class = MapSerializer


class TournamentViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.RetrieveModelMixin):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer

