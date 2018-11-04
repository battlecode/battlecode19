"""
The view that is returned in a request.
"""
from django.contrib.auth import get_user_model
from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework import permissions, status, mixins, viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from api.serializers import *
from api.permissions import *

class SearchResultsPagination(PageNumberPagination):
    page_size = 10


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
    create:
    Creates a new user.

    retrieve:
    Returns a new user with the given username.

    update:
    Updates a user.

    partial_update:
    Partial updates a user.

    destroy:
    Destroys a user.
    """
    queryset = get_user_model().objects.all()
    serializer_class = FullUserSerializer
    permission_classes = (IsAuthenticatedAsRequestedUser,)


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list:
    Returns a list of public user profiles.

    retrieve:
    Returns a public user profile given the username.
    """
    queryset = get_user_model().objects.all().order_by('id')
    serializer_class = BasicUserSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = 'username'
    lookup_url_kwarg = 'username'

    filter_backends = (filters.SearchFilter,)
    search_fields = ('username',)
    pagination_class = SearchResultsPagination



class UserTeamViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list:
    Returns a list of every team a specific user is on.

    retrieve:
    Returns the team the specific user in is on in the specific league.
    """
    serializer_class = BasicTeamSerializer
    permission_classes = (IsAuthenticatedOrSafeMethods,)
    lookup_field = 'league'

    def get_queryset(self):
        """
        Only teams the user is on are visible.
        """
        return Team.objects.filter(users__username=self.kwargs['username'])




class LeagueViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list:
    Returns a list of leagues, ordered by end date.

    retrieve:
    Returns a league from its id e.g. bc18.
    """
    queryset = League.objects.order_by('end_date')
    serializer_class = LeagueSerializer
    permission_classes = (permissions.AllowAny,)


class ReplayViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Replay.objects.all()
    serializer_class = ReplaySerializer
    permission_classes = (permissions.AllowAny,)

    def list(self, request):
        return Response({'message': 'Must lookup specific replay'}, status.HTTP_400_BAD_REQUEST)


class TeamViewSet(viewsets.GenericViewSet,
                  mixins.CreateModelMixin,
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  PartialUpdateModelMixin):
    """
    create:
    Creates a team in this league, where the authenticated user is the first user to join the team.
    The user must not already be on a team in this league. The team must have a unique name, and can
    have a maximum of four members.

    Additionally, the league must be currently active to create a team.

    list:
    Returns a list of active teams in the league, ordered alphabetically by name.

    retrieve:
    Returns an active team in the league. Also gets the team key if the authenticated user is on this team.

    partial_update:
    Updates the team bio, divisions, or auto-accepting for ranked and unranked scrimmages.
    The authenticated user must be on the team, and the league must be active.

    join:
    Joins the team. The league must be active.
    Fails if the team has the maximum number of members, or if the team key is incorrect.

    leave:
    Leaves the team. The authenticated user must be on the team, and the league must be active.
    Deletes the team if this is the last user to leave the team.
    """
    queryset = Team.objects.all().order_by('name').exclude(deleted=True)
    serializer_class = TeamSerializer
    pagination_class = SearchResultsPagination
    permission_classes = (LeagueActiveOrSafeMethods, IsAuthenticatedOrSafeMethods)
    filter_backends = (filters.SearchFilter,)
    search_fields = ('name',)

    def get_queryset(self):
        """
        Only teams within the league are visible.
        """
        return super().get_queryset().filter(league_id=self.kwargs['league_id'])

    def list(self, request, *args, **kwargs):
        """
        If used, do one of the following:
            (1) Paginate.
            (2) Modify team serializer. Maybe something like https://www.peterbe.com/plog/efficient-m2m-django-rest-framework.
        """
        res = super().list(request)

        return res

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    def create(self, request, league_id):
        name = request.data.get('name', None)
        if name is None:
            return Response({'message': 'Team name required'}, status.HTTP_400_BAD_REQUEST)

        if len(self.get_queryset().filter(users__username=request.user.username)) > 0:
            return Response({'message': 'Already on a team in this league'}, status.HTTP_400_BAD_REQUEST)
        if len(self.get_queryset().filter(name=name)) > 0:
            return Response({'message': 'Team with this name already exists'}, status.HTTP_400_BAD_REQUEST)

        try:
            team = {}
            team['league'] = league_id
            team['name'] = request.data.get('name', None)
            team['users'] = [request.user.username]

            serializer = self.get_serializer(data=team)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status.HTTP_201_CREATED)
            return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            error = {'message': ','.join(e.args) if len(e.args) > 0 else 'Unknown Error'}
            return Response(error, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, league_id, pk=None):
        res = super().retrieve(request, pk=pk)
        if res.status_code == status.HTTP_200_OK and request.user.username in res.data.get('users'):
            res.data['team_key'] = self.get_queryset().get(pk=pk).team_key
            res.data['code'] = self.get_queryset().get(pk=pk).code
        return res

    def partial_update(self, request, league_id, pk=None):
        try:
            team = self.get_queryset().get(pk=pk)
        except Team.DoesNotExist:
            return Response({'message': 'Team not found'}, status.HTTP_404_NOT_FOUND)

        if len(team.users.filter(username=request.user.username)) == 0:
            return Response({'message': 'User not on this team'}, status.HTTP_401_UNAUTHORIZED)

        return super().partial_update(request)

    @action(methods=['patch'], detail=True)
    def join(self, request, league_id, pk=None):
        try:
            team = self.get_queryset().get(pk=pk)
        except Team.DoesNotExist:
            return Response({'message': 'Team not found'}, status.HTTP_404_NOT_FOUND)

        if len(self.get_queryset().filter(users__username=request.user.username)) > 0:
            return Response({'message': 'Already on a team in this league'}, status.HTTP_400_BAD_REQUEST)
        if team.team_key != request.data.get('team_key', None):
            return Response({'message': 'Invalid team key'}, status.HTTP_400_BAD_REQUEST)
        if team.users.count() == 4:
            return Response({'message': 'Team has max number of users'}, status.HTTP_400_BAD_REQUEST)
        team.users.add(request.user.id)
        team.save()

        serializer = self.get_serializer(team)
        return Response(serializer.data, status.HTTP_200_OK)

    @action(methods=['patch'], detail=True)
    def leave(self, request, league_id, pk=None):
        try:
            team = self.get_queryset().get(pk=pk)
        except Team.DoesNotExist:
            return Response({'message': 'Team not found'}, status.HTTP_404_NOT_FOUND)

        if len(team.users.filter(username=request.user.username)) == 0:
            return Response({'message': 'User not on this team'}, status.HTTP_401_UNAUTHORIZED)

        team.users.remove(request.user.id)
        team.deleted = team.users.count() == 0
        team.save()

        serializer = self.get_serializer(team)
        return Response(serializer.data, status.HTTP_200_OK)


class SubmissionViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.CreateModelMixin,
                        mixins.RetrieveModelMixin):
    """
    list:
    Returns a list of submissions for the authenticated user's team in this league, in chronological order.

    create:
    Uploads a submission for the authenticated user's team in this league. The file contents
    are uploaded to Google Cloud Storage in the format "/league_id/team_id/submission_id.zip".
    The relative filename is stored in the database and routed through the website.

    The league must be active in order to accept submissions.

    retrieve:
    Returns a submission for the authenticated user's team in this league.

    latest:
    Returns the latest submission for the authenticated user's team in this league.
    """
    queryset = Submission.objects.all().order_by('-submitted_at')
    serializer_class = SubmissionSerializer
    permission_classes = (SubmissionsEnabledOrSafeMethods, IsAuthenticatedOnTeam)

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

    def create(self, request, league_id, team):
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

    @action(methods=['get'], detail=False)
    def latest(self, request, league_id, team):
        submissions = self.get_queryset()
        if submissions.count() == 0:
            return Response({'message': 'Team does not have any submissions'}, status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(submissions[0])
        return Response(serializer.data, status.HTTP_200_OK)



class ScrimmageViewSet(viewsets.GenericViewSet,
                       mixins.ListModelMixin,
                       mixins.CreateModelMixin,
                       mixins.RetrieveModelMixin):
    """
    list:
    Returns a list of scrimmages in the league, where the authenticated user is on one of the participating teams.
    The scrimmages are returned in descending order of the time of request.

    TODO: If the "tournament" parameter accepts a tournament ID to filter, otherwise lists non-tournament scrimmages.

    create:
    Creates a scrimmage in the league, where the authenticated user is on one of the participating teams.
    The map and each team must also be in the league. If the requested team auto accepts this scrimmage,
    then the scrimmage is automatically queued with each team's most recent submission.

    Each team in the scrimmage must have at least one submission.

    retrieve:
    Retrieves a scrimmage in the league, where the authenticated user is on one of the participating teams.

    accept:
    Accepts an incoming scrimmage in the league, where the authenticated user is on the participating team
    that did not request the scrimmage. Queues the game with each team's most recent submissions.

    reject:
    Rejects an incoming scrimmage in the league, where the authenticated user is on the participating team
    that did not request the scrimmage.

    cancel:
    Cancels an outgoing scrimmage in the league, where the authenticated user is on the participating team
    that requested the scrimmage.
    """
    queryset = Scrimmage.objects.all().order_by('-requested_at')
    serializer_class = ScrimmageSerializer
    permission_classes = (SubmissionsEnabledOrSafeMethods, IsAuthenticatedOnTeam)

    def get_team(self, league_id, team_id):
        teams = Team.objects.filter(league_id=league_id, id=team_id)
        if len(teams) == 0:
            return None
        if len(teams) > 1:
            raise InternalError
        return teams[0]

    def get_submission(self, team_id):
        submissions = Submission.objects.all().filter(team_id=team_id).order_by('-submitted_at')
        if submissions.count() == 0:
            return None
        return submissions[0]

    def get_queryset(self):
        team = self.kwargs['team']
        return super().get_queryset().filter(Q(red_team=team) | Q(blue_team=team))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        context['league_id'] = self.kwargs.get('league_id', None)
        return context

    def create(self, request, league_id, team):
        try:
            red_team_id = int(request.data['red_team'])
            blue_team_id = int(request.data['blue_team'])
            ranked = request.data['ranked'] == 'True'

            # Validate teams
            team = self.kwargs['team']
            if team.id == blue_team_id:
                red_team, blue_team = (self.get_team(league_id, red_team_id), team)
                this_team, that_team = (blue_team, red_team)
            elif team.id == red_team_id:
                red_team, blue_team = (team, self.get_team(league_id, blue_team_id))
                this_team, that_team = (red_team, blue_team)
            else:
                return Response({'message': 'Scrimmage does not include my team'}, status.HTTP_400_BAD_REQUEST)
            if that_team is None:
                return Response({'message': 'Requested team does not exist'}, status.HTTP_404_NOT_FOUND)

            data = {
                'league': league_id,
                'red_team': red_team.name,
                'blue_team': blue_team.name,
                'ranked': ranked,
                'requested_by': this_team.id,
            }

            # Check auto accept
            if (ranked and that_team.auto_accept_ranked) or (not ranked and that_team.auto_accept_unranked):
                data['status'] = 'queued'

            # Create scrimmage
            serializer = self.get_serializer(data=data)
            if not serializer.is_valid():
                return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)
            serializer.save()
            return Response(serializer.data, status.HTTP_201_CREATED)
        except Exception as e:
            error = {'message': ','.join(e.args) if len(e.args) > 0 else 'Unknown Error'}
            return Response(error, status.HTTP_400_BAD_REQUEST)

    @action(methods=['patch'], detail=True)
    def accept(self, request, league_id, team, pk=None):
        try:
            scrimmage = self.get_queryset().get(pk=pk)
            if scrimmage.requested_by == team and scrimmage.red_team.id != scrimmage.blue_team.id:
                return Response({'message': 'Cannot accept an outgoing scrimmage.'}, status.HTTP_400_BAD_REQUEST)
            if scrimmage.status != 'pending':
                return Response({'message': 'Scrimmage is not pending.'}, status.HTTP_400_BAD_REQUEST)
            scrimmage.status = 'queued'

            scrimmage.save()

            serializer = self.get_serializer(scrimmage)
            return Response(serializer.data, status.HTTP_200_OK)
        except Scrimmage.DoesNotExist:
            return Response({'message': 'Scrimmage does not exist.'}, status.HTTP_404_NOT_FOUND)

    @action(methods=['patch'], detail=True)
    def reject(self, request, league_id, team, pk=None):
        try:
            scrimmage = self.get_queryset().get(pk=pk)
            if scrimmage.requested_by == team and scrimmage.red_team.id != scrimmage.blue_team.id:
                return Response({'message': 'Cannot reject an outgoing scrimmage.'}, status.HTTP_400_BAD_REQUEST)
            if scrimmage.status != 'pending':
                return Response({'message': 'Scrimmage is not pending.'}, status.HTTP_400_BAD_REQUEST)
            scrimmage.status = 'rejected'

            scrimmage.save()

            serializer = self.get_serializer(scrimmage)
            return Response(serializer.data, status.HTTP_200_OK)
        except Scrimmage.DoesNotExist:
            return Response({'message': 'Scrimmage does not exist.'}, status.HTTP_404_NOT_FOUND)

    @action(methods=['patch'], detail=True)
    def cancel(self, request, league_id, team, pk=None):
        try:
            scrimmage = self.get_queryset().get(pk=pk)
            if scrimmage.requested_by != team:
                return Response({'message': 'Cannot cancel an incoming scrimmage.'}, status.HTTP_400_BAD_REQUEST)
            if scrimmage.status != 'pending':
                return Response({'message': 'Scrimmage is not pending.'}, status.HTTP_400_BAD_REQUEST)
            scrimmage.status = 'cancelled'

            scrimmage.save()

            serializer = self.get_serializer(scrimmage)
            return Response(serializer.data, status.HTTP_200_OK)
        except Scrimmage.DoesNotExist:
            return Response({'message': 'Scrimmage does not exist.'}, status.HTTP_404_NOT_FOUND)


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
