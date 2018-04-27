from rest_framework import permissions


class IsAuthenticatedAsRequestedUser(permissions.BasePermission):
    message = 'Must be authenticated as the requested user.'

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.id == obj.id


class IsAuthenticatedOrUnsafeMethods(permissions.BasePermission):
    message = 'Must be authenticated to perform unsafe methods. Otherwise, all are allowed.'

    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS or request.user.is_authenticated
