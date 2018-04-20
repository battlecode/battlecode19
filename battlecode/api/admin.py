"""
What database fields are modifiable through the Django admin interface,
and how these fields appear in the UI.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import *


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Private', {'fields': ('date_of_birth', 'registration_key')}),
        ('User Profile', {
            'fields': ('bio', 'avatar', 'country')
        }),
    )


@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'year', 'start_date', 'end_date', 'hidden')
    list_display_links = ('id', 'name')


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('id', 'league', 'name', 'style', 'date_time', 'divisions', 'hidden')
    list_display_links = ('id', 'name')
    list_filter = ('league',)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'league', 'name', 'users', 'divisions', 'mu', 'sigma', 'deleted')
    list_display_links = ('id', 'name')
    list_filter = ('league', 'divisions', 'deleted')


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'team', 'name', 'filename', 'submitted_at')
    list_display_links = ('id', 'name')
    list_filter = ('team',)


@admin.register(Map)
class MapAdmin(admin.ModelAdmin):
    list_display = ('id', 'league', 'name', 'filename', 'hidden')
    list_display_links = ('id', 'name')
    list_filter = ('league',)


@admin.register(Scrimmage)
class ScrimmageAdmin(admin.ModelAdmin):
    list_display = ('id', 'league', 'red_team', 'blue_team', 'updated_at', 'status', 'map', 'ranked',
        'tournament', 'round', 'subround', 'index', 'hidden', 'winner_hidden')
    list_filter = ('red_team', 'blue_team', 'tournament')
