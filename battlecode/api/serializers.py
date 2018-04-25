"""
The medium between JSON and Python database objects. Also any
events that need to happen before, during, or after serializing
or deserializing objects.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import *


class UserProfileSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('url', 'username', 'avatar', 'bio', 'country')
        read_only_fields = ('avatar',)


class UserSerializer(serializers.HyperlinkedModelSerializer):
    userprofile = UserProfileSerializer()

    class Meta:
        model = get_user_model()
        fields = ('url', 'email', 'first_name', 'last_name', 'date_of_birth', 'userprofile')

    def create(self, validated_data):
        """
        Create and return a new user, given the validated data.
        """
        try:
            user_profile_data = validated_data.pop('userprofile')
            username = user_profile_data.get('username')
            user = get_user_model().objects.create_user(username=username, **validated_data)

            user.userprofile.username = username
            if 'country' in user_profile_data:
                user.userprofile.country = user_profile_data.get('country')

            user.save()
            return user
        except Exception as e:
            error = {'message': ','.join(e.args) if len(e.args) > 0 else 'Unknown Error'}
            raise serializers.ValidationError(error)

    def update(self, instance, validated_data):
        """
        Update and return an existing user object, given the validated data.
        """
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)

        userprofile = validated_data.get('userprofile', None)
        if userprofile:
            instance.userprofile.bio = userprofile.get('bio', instance.userprofile.bio)
            instance.userprofile.country = userprofile.get('country', instance.userprofile.country)

        instance.save()
        return instance


class LeagueSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = League
        fields = ('url', 'name', 'year', 'start_date', 'end_date')


class TeamSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Team
        fields = ('url', 'league', 'name', 'bio', 'avatar', 'users', 'divisions', 'updated_at')


class SubmissionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Submission
        fields = ('url', 'team', 'name', 'filename', 'submitted_at')


class ScrimmageSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Scrimmage
        fields = ('url', 'league', 'red_team', 'blue_team', 'red_submission', 'blue_submission', 'requested_at',
            'started_at', 'updated_at', 'status', 'map', 'ranked', 'replay', 'red_logs', 'blue_logs',
            'tournament', 'round', 'subround', 'index', 'winner_hidden')


class MapSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Map
        fields = ('url', 'league', 'name', 'filename')


class TournamentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Tournament
        fields = ('url', 'league', 'name', 'style', 'date_time', 'divisions', 'maps', 'stream_link')


class TournamentScrimmageSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = TournamentScrimmage
