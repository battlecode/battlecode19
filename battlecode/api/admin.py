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
    list_display = ('id', 'name', 'date', 'style', 'hidden')
    list_display_links = ('name',)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'mu', 'sigma')
    list_display_links = ('name',)
