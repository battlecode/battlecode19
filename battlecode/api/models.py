"""
The database schema, and any events that may need to happen before,
during, or after saving objects in the database.
"""

import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres import fields
from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver


HIGHSCHOOL = 'HS'
NEWBIE     = 'NE'
COLLEGE    = 'CO'
PRO        = 'PR'


TOURNAMENT_DIVISION_CHOICES = (
    (HIGHSCHOOL, 'High School'),
    (NEWBIE, 'Newbie'),
    (COLLEGE, 'College'),
    (PRO, 'Pro'),
)


class Tournament(models.Model):
    TRUESKILL   = 'TR'
    SINGLE_ELIM = 'SE'
    DOUBLE_ELIM = 'DE'

    TOURNAMENT_STYLE_CHOICES = (
        (TRUESKILL, 'TrueSkill'),
        (SINGLE_ELIM, 'Single Elimination'),
        (DOUBLE_ELIM, 'Double Elimination'),
    )

    name        = models.TextField()
    divisions   = fields.ArrayField(models.CharField(max_length=2, choices=TOURNAMENT_DIVISION_CHOICES), default=list)
    date        = models.DateField()
    style       = models.CharField(max_length=2, choices=TOURNAMENT_STYLE_CHOICES)
    details     = models.TextField(blank=True)
    stream_link = models.TextField(blank=True)
    maps        = fields.ArrayField(models.IntegerField(), default=list)
    hidden      = models.BooleanField(default=True)

    def __str__(self):
        return '{} {} {}'.format(self.name, self.style, self.date)


class Map(models.Model):
    name     = models.TextField()
    filename = models.TextField()

    def __str__(self):
        return '(#%d) %s'.format(self.id, self.name)


class Team(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    name       = models.CharField(max_length=64, unique=True)
    bio        = models.CharField(max_length=1000, blank=True)
    avatar     = models.TextField(blank=True)
    users      = fields.ArrayField(models.IntegerField(), size=4, default=list)
    divisions  = fields.ArrayField(models.CharField(max_length=2, choices=TOURNAMENT_DIVISION_CHOICES), default=list)
    mu         = models.FloatField(default=25)
    sigma      = models.FloatField(default=8.333)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return '(#%d) %s'.format(self.id, self.name)


class Submission(models.Model):
    tournament   = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    team         = models.ForeignKey(Team, on_delete=models.CASCADE)
    name         = models.TextField()
    filename     = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return '(#%d) %s'.format(self.id, self.name)


class User(AbstractUser):
    email            = models.EmailField(unique=True)
    first_name       = models.CharField(max_length=30)
    last_name        = models.CharField(max_length=150)
    date_of_birth    = models.DateField()
    registration_key = models.CharField(max_length=32, null=True, unique=True)
    bio              = models.CharField(max_length=1000, blank=True)
    avatar           = models.TextField(blank=True)
    country          = models.TextField(blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'date_of_birth']


@receiver(pre_save, sender=settings.AUTH_USER_MODEL)
def create_user(sender, instance, raw, **kwargs):
    """
    Generate a new registration key for the user.
    """
    if not raw and instance._state.adding:
        instance.registration_key = uuid.uuid4().hex
