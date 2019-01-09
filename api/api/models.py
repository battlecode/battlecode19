"""
The database schema, and any events that may need to happen before,
during, or after saving objects in the database.
"""

import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres import fields
from django.core.mail import EmailMultiAlternatives
from django.db import models
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.urls import reverse
from django_rest_passwordreset.signals import reset_password_token_created


def send_email(recipient, subject, content, is_html):
    from_address = settings.EMAIL_HOST_USER
    msg = EmailMultiAlternatives(subject, content, from_address, [recipient])
    EmailMultiAlternatives
    if is_html:
        msg.content_subtype = "html"
    msg.send()

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


class User(AbstractUser):
    email            = models.EmailField(unique=True)
    username         = models.CharField(max_length=30, unique=True)
    first_name       = models.CharField(max_length=30)
    last_name        = models.CharField(max_length=150)
    date_of_birth    = models.DateField()
    registration_key = models.CharField(max_length=32, null=True, unique=True)
    verified         = models.BooleanField(default=False)

    bio      = models.CharField(max_length=1000, blank=True)
    avatar   = models.TextField(blank=True)
    country  = models.TextField(blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name', 'date_of_birth']


class League(models.Model):
    id                  = models.TextField(primary_key=True)
    name                = models.TextField()
    start_date          = models.DateField()
    end_date            = models.DateField()
    active              = models.BooleanField(default=False)
    submissions_enabled = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Update(models.Model):
    message = models.CharField(max_length=1000, blank=True)
    time = models.DateTimeField(auto_now_add=True)
    league = models.ForeignKey(League, related_name='updates', on_delete=models.PROTECT)



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
    stream_link = models.TextField(blank=True)
    hidden      = models.BooleanField(default=True)

    def __str__(self):
        return '{}: {} {}'.format(self.league, self.name, self.date_time)


class Team(models.Model):
    league    = models.ForeignKey(League, on_delete=models.PROTECT)
    name      = models.CharField(max_length=64)
    team_key  = models.CharField(max_length=16, unique=True)
    avatar    = models.TextField(blank=True)
    users     = models.ManyToManyField(User, default=list)

    # team profile
    bio       = models.CharField(max_length=1000, blank=True)
    divisions = fields.ArrayField(models.TextField(choices=TOURNAMENT_DIVISION_CHOICES), default=list)

    # scrimmages
    mu                   = models.FloatField(default=25)
    sigma                = models.FloatField(default=8.333)
    auto_accept_ranked   = models.BooleanField(default=False)
    auto_accept_unranked = models.BooleanField(default=False)
    wins                 = models.IntegerField(default=0)
    losses               = models.IntegerField(default=0)
    draws                = models.IntegerField(default=0)

    code                 = models.TextField(default="// Get started by reading the docs!")

    # metadata
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return '{}: (#{}) {}'.format(self.league, self.id, self.name)


class Submission(models.Model):
    team         = models.ForeignKey(Team, on_delete=models.PROTECT)
    name         = models.CharField(max_length=150)
    filename     = models.TextField(null=True, default=None)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return '{}: (#{}) {}'.format(self.team, self.id, self.name)

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
    ranked    = models.BooleanField(default=False)

    # Match-running (completed by match runner)
    status    = models.TextField(choices=SCRIMMAGE_STATUS_CHOICES, default='pending')
    replay    = models.TextField(blank=True)

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


@receiver(pre_save, sender=settings.AUTH_USER_MODEL)
def gen_registration_key(sender, instance, raw, update_fields, **kwargs):
    """
    Generate a new registration key for the user.
    """
    if not raw and instance._state.adding:
        instance.registration_key = uuid.uuid4().hex
        email = instance.email
        context = {
            'username': instance.username,
            'verification_key': instance.registration_key,
            'url': ' https://battlecode.org/verify/' +
            instance.registration_key
        }
        content = render_to_string('email/verification.html', context)
        # send_email(email, 'Email Verification', content, True)



@receiver(pre_save, sender=Team)
def gen_team_key(sender, instance, raw, update_fields, **kwargs):
    """
    Generate a new team key.
    """
    if not raw and instance._state.adding:
        instance.team_key = uuid.uuid4().hex[:16]

@receiver(post_save, sender=Submission)
def gen_filename(sender, instance, created, **kwargs):
    """
    Saves the filename in the format "/league_id/team_id/submission_id.zip".
    """
    if created:
        league_id = instance.team.league.id
        team_id = instance.team.id
        filename = '/{}/{}/{}.zip'.format(league_id, team_id, instance.id)
        instance.filename = filename
        instance.save()


@receiver(reset_password_token_created)
def password_reset_token_created(sender, reset_password_token, *args, **kwargs):
    """
    Handles password reset tokens
    When a token is created, an e-mail needs to be sent to the user
    :param sender:
    :param reset_password_token:
    :param args:
    :param kwargs:
    :return:
    """
    # send an e-mail to the user
    email = reset_password_token.user.email
    context = {
        'username': reset_password_token.user.username,
        'reset_password_url':
        "https://battlecode.org/password/change/?token={}"
        .format(reset_password_token.key)
    }
    content = render_to_string('email/password_reset.html', context)
    send_email(email, 'Password Reset Token', content, True)
