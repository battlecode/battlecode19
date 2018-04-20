"""
The medium between JSON and Python database objects. Also any
events that need to happen before, during, or after serializing
or deserializing objects.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import *


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ('url', 'username', 'email', 'first_name', 'last_name', 'date_of_birth', 'bio', 'country')
        read_only_fields = ('id', 'avatar')
        ordering = ('id',)

    def create(self, validated_data):
        """
        Create and return a new user, given the validated data.
        """
        try:
            return get_user_model().objects.create_user(**validated_data)
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
        instance.bio = validated_data.get('bio', instance.bio)
        instance.country = validated_data.get('country', instance.country)
        instance.save()
        return instance


class LeagueSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = League
        fields = ('url', 'name', 'year', 'start_date', 'end_date')


class TournamentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Tournament
        fields = ('url', 'league', 'name', 'style', 'date_time', 'divisions', 'maps', 'stream_link')


class TeamSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Team
        fields = ('url', 'league', 'name', 'bio', 'avatar', 'users', 'divisions', 'updated_at')


class SubmissionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Submission
        fields = ('url', 'team', 'name', 'filename', 'submitted_at')


class MapSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Map
        fields = ('url', 'league', 'name', 'filename')


class ScrimmageSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Scrimmage
        fields = ('url', 'league', 'red_team', 'blue_team', 'red_submission', 'blue_submission', 'requested_at',
            'started_at', 'updated_at', 'status', 'map', 'ranked', 'replay', 'red_logs', 'blue_logs',
            'tournament', 'round', 'subround', 'index', 'winner_hidden')
