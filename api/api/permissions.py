from django.db import InternalError
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

from api.models import League, Team


class IsAuthenticatedAsRequestedUser(permissions.BasePermission):
    message = 'Must be authenticated as the requested user.'

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.id == obj.id


class IsAuthenticatedOrSafeMethods(permissions.BasePermission):
    message = 'Must be authenticated to perform unsafe methods. Otherwise, all are allowed.'

    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS or request.user.is_authenticated


class LeagueActiveOrSafeMethods(permissions.BasePermission):
    message = 'League must exist, and must also be active to access unsafe methods.'

    def has_permission(self, request, view):
        try:
            league = League.objects.get(pk=view.kwargs.get('league_id'))
        except League.DoesNotExist:
            raise PermissionDenied
        return request.method in permissions.SAFE_METHODS or league.active


class SubmissionsEnabledOrSafeMethods(LeagueActiveOrSafeMethods):
    message = 'Submissions for the league must be enabled, or only safe methods permitted.'

    def has_permission(self, request, view):
        try:
            league = League.objects.get(pk=view.kwargs.get('league_id'))
        except League.DoesNotExist:
            raise PermissionDenied
        return request.method in permissions.SAFE_METHODS or (league.active and league.submissions_enabled)


class IsAuthenticatedOnTeam(LeagueActiveOrSafeMethods):
    message = 'Must be authenticated and on a team in this league.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        teams = Team.objects.filter(league_id=view.kwargs.get('league_id'), users__username=request.user.username)
        if len(teams) == 0:
            raise PermissionDenied
        if len(teams) > 1:
            raise InternalError
        view.kwargs['team'] = teams[0]
        return True
