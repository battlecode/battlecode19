"""
The database schema, and any events that may need to happen before,
during, or after saving objects in the database.
"""

import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres import fields
from django.db import models
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver


HIGHSCHOOL = 'highschool'
NEWBIE     = 'newbie'
COLLEGE    = 'college'
PRO        = 'pro'


TOURNAMENT_DIVISION_CHOICES = (
    (HIGHSCHOOL, 'High School'),
    (NEWBIE, 'Newbie'),
    (COLLEGE, 'College'),
    (PRO, 'Pro'),
)


class League(models.Model):
    id         = models.TextField(primary_key=True)
    name       = models.TextField()
    start_date = models.DateField()
    end_date   = models.DateField()
    active     = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Tournament(models.Model):
    TRUESKILL   = 'trueskill'
    SINGLE_ELIM = 'singleelim'
    DOUBLE_ELIM = 'doubleelim'

    TOURNAMENT_STYLE_CHOICES = (
        (TRUESKILL, 'TrueSkill'),
        (SINGLE_ELIM, 'Single Elimination'),
        (DOUBLE_ELIM, 'Double Elimination'),
    )

    league      = models.ForeignKey(League, on_delete=models.PROTECT)
    name        = models.TextField()
    style       = models.TextField(choices=TOURNAMENT_STYLE_CHOICES)
    date_time   = models.DateTimeField()
    divisions   = fields.ArrayField(models.TextField(choices=TOURNAMENT_DIVISION_CHOICES), blank=True, default=list)
    maps        = fields.ArrayField(models.IntegerField(), blank=True, default=list)  # references Map
    stream_link = models.TextField(blank=True)
    hidden      = models.BooleanField(default=True)

    def __str__(self):
        return '{}: {} {}'.format(self.league, self.name, self.date_time)


class Team(models.Model):
    league    = models.ForeignKey(League, on_delete=models.PROTECT)
    name      = models.CharField(max_length=64)
    team_key  = models.CharField(max_length=16, unique=True)
    avatar    = models.TextField(blank=True)
    users     = fields.ArrayField(models.IntegerField(), size=4, default=list)  # references User

    # team profile
    bio       = models.CharField(max_length=1000, blank=True)
    divisions = fields.ArrayField(models.TextField(choices=TOURNAMENT_DIVISION_CHOICES), default=list)

    # scrimmages
    mu                   = models.FloatField(default=25)
    sigma                = models.FloatField(default=8.333)
    auto_accept_ranked   = models.BooleanField(default=False)
    auto_accept_unranked = models.BooleanField(default=False)

    # metadata
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return '{}: (#{}) {}'.format(self.league, self.id, self.name)


class Submission(models.Model):
    team         = models.ForeignKey(Team, on_delete=models.PROTECT)
    name         = models.CharField(max_length=150)
    filename     = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return '{}: (#{}) {}'.format(self.team, self.id, self.name)


class Map(models.Model):
    league   = models.ForeignKey(League, on_delete=models.PROTECT)
    name     = models.TextField()
    filename = models.TextField()
    hidden   = models.BooleanField(default=True)

    def __str__(self):
        return '(#{}) {}'.format(self.id, self.name)


class Scrimmage(models.Model):
    SCRIMMAGE_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('queued', 'Queued'),
        ('running', 'Running'),
        ('redwon', 'Red Won!'),
        ('bluewon', 'Blue Won!'),
        ('rejected', 'Rejected'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )

    # Match-running (completed by requester)
    league    = models.ForeignKey(League, on_delete=models.PROTECT)
    red_team  = models.ForeignKey(Team, null=True, on_delete=models.PROTECT, related_name='red_team')
    blue_team = models.ForeignKey(Team, null=True, on_delete=models.PROTECT, related_name='blue_team')
    map       = models.ForeignKey(Map, on_delete=models.PROTECT)
    ranked    = models.BooleanField(default=False)

    # Match-running (completed by match runner)
    red_submission  = models.ForeignKey(Submission, null=True, on_delete=models.PROTECT, related_name='red_submission')
    blue_submission = models.ForeignKey(Submission, null=True, on_delete=models.PROTECT, related_name='blue_submission')
    status          = models.TextField(choices=SCRIMMAGE_STATUS_CHOICES, default='pending')
    replay          = models.TextField(blank=True)
    red_logs        = models.TextField(blank=True)
    blue_logs       = models.TextField(blank=True)

    # Metadata
    requested_by = models.ForeignKey(Team, null=True, on_delete=models.PROTECT, related_name='requested_by')
    requested_at = models.DateTimeField(auto_now_add=True)
    started_at   = models.DateTimeField(null=True)
    updated_at   = models.DateTimeField(auto_now=True)

    def __str__(self):
        return '{}: (#{}) {} vs {}'.format(self.league, self.id, self.red_team, self.blue_team)


class TournamentScrimmage(models.Model):
    tournament    = models.ForeignKey(Tournament, on_delete=models.PROTECT)
    scrimmage     = models.OneToOneField(Scrimmage, on_delete=models.PROTECT)
    round         = models.IntegerField(null=True)
    subround      = models.CharField(max_length=1, null=True)
    index         = models.IntegerField(null=True)
    red_from      = models.ForeignKey('self', null=True, default=None, on_delete=models.SET_DEFAULT, related_name='+')
    blue_from     = models.ForeignKey('self', null=True, default=None, on_delete=models.SET_DEFAULT, related_name='+')
    hidden        = models.BooleanField(default=True)
    winner_hidden = models.BooleanField(default=True)

    def __str__(self):
        return '{}: (#{}) {} vs {} Round {}{} Game {}'.format(
            self.tournament, self.id, self.red_team, self.blue_team, self.round, self.subround, self.index)


class User(AbstractUser):
    email            = models.EmailField(unique=True)
    first_name       = models.CharField(max_length=30)
    last_name        = models.CharField(max_length=150)
    date_of_birth    = models.DateField()
    registration_key = models.CharField(max_length=32, null=True, unique=True)
    verified         = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'date_of_birth']


class UserProfile(models.Model):
    user     = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    username = models.CharField(max_length=30)
    bio      = models.CharField(max_length=1000, blank=True)
    avatar   = models.TextField(blank=True)
    country  = models.TextField(blank=True)

    def __str__(self):
        return self.username


@receiver(pre_save, sender=settings.AUTH_USER_MODEL)
def gen_registration_key(sender, instance, raw, update_fields, **kwargs):
    """
    Generate a new registration key for the user.
    """
    if not raw and instance._state.adding:
        instance.registration_key = uuid.uuid4().hex


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def update_user_profile(sender, instance, created, update_fields, **kwargs):
    """
    Save the user profile after saving the user.
    """
    if created:
        UserProfile.objects.create(user=instance)
    instance.userprofile.save()


@receiver(pre_save, sender=Team)
def gen_team_key(sender, instance, raw, update_fields, **kwargs):
    """
    Generate a new team key.
    """
    if not raw and instance._state.adding:
        instance.team_key = uuid.uuid4().hex[:16]
