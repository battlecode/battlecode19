from django.http import Http404
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .serializers import *


class TeamListCreate(generics.ListCreateAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer


class UserCreate(generics.CreateAPIView):
    """
    Create a new user.
    """
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)


class UserDetail(generics.RetrieveAPIView):
    """
    Modify (TODO) or get the current user. GET returns private user info only of the
    currently authenticated user. Otherwise it returns public user info.
    """
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.AllowAny,)

    def get_object(self, pk):
        try:
            return get_user_model().objects.get(pk=pk)
        except get_user_model().DoesNotExist:
            return None

    def is_current_user(self, request, pk):
        return request.user.is_authenticated and request.user.id == pk

    def get(self, request, pk, format=None):
        user = self.get_object(pk)
        if user is None:
            return Response(None, status=status.HTTP_404_NOT_FOUND)

        serializer = self.serializer_class(user, context={'request': request})
        private_fields = ['email', 'first_name', 'last_name', 'date_of_birth']
        data = serializer.data
        if not self.is_current_user(request, pk):
            for field in private_fields:
                data.pop(field, None)
        return Response(data, status=status.HTTP_200_OK)
