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
            'fields': ('team', 'bio', 'avatar', 'country')
        }),
    )


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'divisions', 'date', 'style', 'details', 'stream_link', 'maps', 'hidden')
    list_display_links = ('name',)


@admin.register(Map)
class MapAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'filename')
    list_display_links = ('name',)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'tournament', 'users', 'divisions', 'mu', 'sigma')
    list_display_links = ('name',)


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'tournament', 'team', 'filename', 'submitted_at')
    list_display_links = ('name',)
