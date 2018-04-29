"""
The view that is returned in a request.
"""
from django.core.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from django.db import InternalError
from rest_framework import permissions, status, mixins, viewsets
from rest_framework.decorators import action
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
        """
        Requests are forbidden if the league does not exist. If the league exists but is currently
        inactive, read-only requests are permitted only. Otherwise, authentication is required.
        """
        league = League.objects.get(pk=self.kwargs.get('league_id'))
        if league is None:
            raise PermissionDenied
        if self.request.method not in permissions.SAFE_METHODS and not league.active:
            raise PermissionDenied
        return [IsAuthenticatedOrSafeMethods()]

    def get_queryset(self):
        """
        Only teams within the league are visible.
        """
        return super().get_queryset().filter(league_id=self.kwargs['league_id'])

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    def create(self, request, league_id):
        """
        Creates a team in this league, where the authenticated user is the first user to join the team.
        The user must not already be on a team in this league. The team must have a unique name, and can
        have a maximum of four members.

        Additionally, the league must be currently active to create a team.
        """
        name = request.data.get('name', None)
        if name is None:
            return Response({'message': 'Team name required'}, status.HTTP_400_BAD_REQUEST)

        if len(self.get_queryset().filter(users__user_id=request.user.id)) > 0:
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
        Additionally, the league must be active to update the team.

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
            if len(self.get_queryset().filter(users__user_id=request.user.id)) > 0:
                return Response({'message': 'Already on a team in this league'}, status.HTTP_400_BAD_REQUEST)
            if team.team_key != request.data.get('team_key', None):
                return Response({'message': 'Invalid team key'}, status.HTTP_400_BAD_REQUEST)
            if team.users.count() == 4:
                return Response({'message': 'Team has max number of users'}, status.HTTP_400_BAD_REQUEST)
            team.users.add(request.user.id)
            team.save()

            serializer = self.get_serializer(team)
            return Response(serializer.data, status.HTTP_200_OK)

        if len(team.users.filter(user_id=request.user.id)) == 0:
            return Response({'message': 'User not on this team'}, status.HTTP_401_UNAUTHORIZED)

        if op == 'leave':
            team.users.remove(request.user.id)
            team.deleted = team.users.count() == 0
            team.save()

            serializer = self.get_serializer(team)
            return Response(serializer.data, status.HTTP_200_OK)

        return super().partial_update(request)


class SubmissionViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.CreateModelMixin,
                        mixins.RetrieveModelMixin):
    queryset = Submission.objects.all().order_by('id')
    serializer_class = SubmissionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_permissions(self):
        """
        Requests are forbidden if the league does not exist. If the league exists but submissions are
        not enabled, or if the league is inactive, read-only requests are permitted only.

        Finally, the user must be authenticated and on a team in this league.
        """
        league = League.objects.get(pk=self.kwargs.get('league_id'))
        if league is None:
            raise PermissionDenied
        if self.request.method not in permissions.SAFE_METHODS:
            if not (league.active and league.submissions_enabled):
                raise PermissionDenied

        if self.request.user.is_authenticated:
            teams = Team.objects.filter(league_id=self.kwargs['league_id'], users__user_id=self.request.user.id)
            if len(teams) == 0:
                raise PermissionDenied
            if len(teams) > 1:
                raise InternalError
            self.kwargs['team'] = teams[0]

        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """
        Only submissions belonging to the user's team in this league are visible.
        """
        return super().get_queryset().filter(team=self.kwargs['team'])

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    def list(self, request, league_id, team):
        """
        Lists the submissions for the authenticated user's team in this league, in chronological order
        of submission.
        """
        return super().list(request)

    def create(self, request, league_id, team):
        """
        Uploads a submission for the authenticated user's team in this league. The file contents
        are uploaded to Google Cloud Storage in the format "/league_id/team_id/submission_id.zip".
        The relative filename is stored in the database and routed through the website.

        The league must be active in order to accept submissions.
        """
        submission_num = self.get_queryset().count() + 1
        data = {
            'team': team.id,
            'name': request.data.get('name'),
        }

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)
        serializer.save()

        # TODO: Handle file upload
        return Response(serializer.data, status.HTTP_201_CREATED)

    def retrieve(self, request, league_id, team, pk=None):
        """
        Retrieves the submission for the authenticated user's team in this league.
        """
        return super().retrieve(request)


class ScrimmageViewSet(viewsets.GenericViewSet,
                       mixins.ListModelMixin,
                       mixins.CreateModelMixin,
                       mixins.RetrieveModelMixin):
    queryset = Scrimmage.objects.all()
    serializer_class = ScrimmageSerializer


    def get_permissions(self):
        """
        Requests are forbidden if the league does not exist. If the league exists but submissions are
        not enabled, read-only requests are permitted only.

        Finally, the user must be authenticated and on a team in this league. This team must have at least
        one submission to create a scrimmage or be requested in a scrimmage created by another team.
        """
        pass

    def create(self):
        """
        Creates a scrimmage in the league, where the authenticated user is on one of the participating teams.
        The map and each team must also be in the league. If the requested team auto accepts this scrimmage,
        then the scrimmage is automatically queued with each team's most recent submission.
        """
        pass

    def list(self):
        """
        Lists the scrimmages in the league, where the authenticated user is on one of the participating teams.
        The scrimmages are returned in descending order of the time of request. Optionally filters the scrimmages
        to only include those with the requested "statuses" (pending, queued, running, redwon, bluewon, rejected
        failed, cancelled), or from the requested tournament. If the "tournament" parameter is not given, only
        lists non-tournament scrimmages.
        """
        pass

    def retrieve(self):
        """
        Retrieves a scrimmage in the league, where the authenticated user is on one of the participating teams.
        """
        pass

    @action(methods=['patch'], detail=True)
    def accept(self):
        """
        Accepts an incoming scrimmage in the league, where the authenticated user is on the participating team
        that did not request the scrimmage. Queues the game with each team's most recent submissions.
        """
        pass

    @action(methods=['patch'], detail=True)
    def reject(self):
        """
        Rejects an incoming scrimmage in the league, where the authenticated user is on the participating team
        that did not request the scrimmage.
        """
        pass

    @action(methods=['patch'], detail=True)
    def cancel(self):
        """
        Cancels an outgoing scrimmage in the league, where the authenticated user is on the participating team
        that requested the scrimmage.
        """
        pass


class MapViewSet(viewsets.GenericViewSet,
                 mixins.ListModelMixin,
                 mixins.RetrieveModelMixin):
    queryset = Map.objects.all().exclude(hidden=True)
    serializer_class = MapSerializer


class TournamentViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.RetrieveModelMixin):
    queryset = Tournament.objects.all().exclude(hidden=True)
    serializer_class = TournamentSerializer

    @action(methods=['get'], detail=True)
    def bracket(self):
        """
        Retrieves the bracket for a tournament in this league. Formatted as a list of rounds, where each round
        is a list of games, and each game consists of a list of at most 3 matches. Can be formatted either as a
        "replay" file for the client or for display on the "website". Defaults to "website" format.

        Formats:
         - "replay": Returns the minimum number of games to ensure the winning team has a majority of wins
            in the order each match was played i.e. 2 games if the team wins the first 2 games out of 3.
         - "website": Includes all 3 matches regardless of results. Does not return avatars or list of winner IDs.

        {
            "tournament": {...},
            "rounds": [{
                "round": "3A",
                "games": [{
                    "index": 0",
                    "red_team": {
                        "id": 1,
                        "name": "asdf",
                        "avatar": "avatar/1.gif"
                    },
                    "blue_team": {
                        "id": 2,
                        "name": "asdfasdfasf",
                        "avatar": "avatar/2.gif"
                    },
                    "replays": ["replay/1.bc18", "replay/2.bc18"],
                    "winner_ids": [2, 2],
                    "winner_id": 2
                }, {
                    "index": 1,
                    "red_team": {
                        "id": 3,
                        "name": "assdfdf",
                        "avatar": "avatar/3.jpg"
                    },
                    "blue_team": {
                        "id": 4,
                        "name": "asdfasdfasf",
                        "avatar": "avatar/4.png"
                    },
                    "replays": ["replay/3.bc18", "replay/4.bc18", "replay/5.bc18"],
                    "winner_ids": [3, 4, 4],
                    "winner_id": 4
                }]
            }]
        }
        """
        pass
