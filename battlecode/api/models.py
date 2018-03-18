import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
# from django.contrib.postgres import fields
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

    name      = models.TextField()
    date      = models.DateField()
    style     = models.CharField(max_length=2, choices=TOURNAMENT_STYLE_CHOICES)
    # divisions = fields.ArrayField(models.CharField(max_length=2, choices=TOURNAMENT_DIVISION_CHOICES))
    hidden    = models.BooleanField(default=True)

    def __str__(self):
        return '{} {}'.format(self.name, self.date)


class Team(models.Model):
    name      = models.CharField(max_length=64, unique=True)
    bio       = models.CharField(max_length=1000, blank=True)
    avatar    = models.TextField(blank=True)
    # divisions = fields.ArrayField(models.CharField(max_length=2, choices=TOURNAMENT_DIVISION_CHOICES))
    mu        = models.FloatField(default=25)
    sigma     = models.FloatField(default=8.333)

    def __str__(self):
        return self.name


class User(AbstractUser):
    email            = models.EmailField(unique=True)
    first_name       = models.CharField(max_length=30)
    last_name        = models.CharField(max_length=150)
    date_of_birth    = models.DateField()
    registration_key = models.CharField(max_length=32, null=True, unique=True)
    team             = models.ForeignKey(Team, null=True, default=None, on_delete=models.SET_NULL)
    bio              = models.CharField(max_length=1000, blank=True)
    avatar           = models.TextField(blank=True)
    country          = models.TextField(blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'date_of_birth', 'password']


@receiver(pre_save, sender=settings.AUTH_USER_MODEL)
def create_user(sender, instance, raw, **kwargs):
    """
    Generate a new registration key for the user.
    """
    if not raw and instance._state.adding:
        instance.registration_key = uuid.uuid4().hex
