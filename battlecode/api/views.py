"""
The view that is returned in a request.
"""

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


class UserDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or destroy a user, with limited permissions.
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
        """
        Returns profile info the requested user.

        Also includes private info like email, name, and date of birth
        if the requested user is the currently authenticated user.
        """
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

    def patch(self, request, pk, format=None):

        if not self.is_current_user(request, pk):
            return Response(None, status=status.HTTP_401_UNAUTHORIZED)

        user = self.get_object(pk)
        # user won't be none since we must be logged in

        # Get old data
        old_serializer = self.serializer_class(user, context={'request': request})
        data = old_serializer.data

        # update old data
        for key in request.data.keys():
            data[key] = request.data[key]

        # reinsert data
        update_serializer = self.serializer_class(user, data=data)

        if not update_serializer.is_valid():
            # I don't think this line can be hitm because all the data should be
            # present
            return Response(update_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        update_serializer.save()

        # create output data
        output_serializer = self.serializer_class(user, context={'request': request})
        output_data = output_serializer.data
        return Response(output_data, status=status.HTTP_200_OK)

    def put(self, request, pk, format=None):

        if not self.is_current_user(request, pk):
            return Response(None, status=status.HTTP_401_UNAUTHORIZED)

        # user won't be none since we must be logged in
        user = self.get_object(pk)

        # reinsert data
        update_serializer = self.serializer_class(user, data=request.data)

        if not update_serializer.is_valid():
            return Response(update_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        update_serializer.save()

        # create output data
        output_serializer = self.serializer_class(user, context={'request': request})
        output_data = output_serializer.data
        return Response(output_data, status=status.HTTP_200_OK)

    def delete(self, request, pk, format=None):
        """
        Deletes this user only if it is the currently authenticated user.
        It's what happens when you remove an account.
        """
        if not self.is_current_user(request, pk):
            return Response(None, status=status.HTTP_401_UNAUTHORIZED)

        user = self.get_object(pk)
        user.delete()
        return Response(None, status=status.HTTP_204_NO_CONTENT)
