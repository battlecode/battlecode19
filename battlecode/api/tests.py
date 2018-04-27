import json
import sys
import logging

from django.contrib.auth import get_user_model
from rest_framework import status, test

from battlecode.api.views import *
from battlecode.api.models import *


def generate_user(id_num, **kwargs):
    user = {
        'email': 'user_{}@battlecode.org'.format(id_num),
        'password': 'password',
        'date_of_birth': '2018-01-01',
        'first_name': 'battle',
        'last_name': 'code',
        'userprofile': {
            'username': 'user_{}'.format(id_num),
            'country': 'USA',
        },
    }

    for key in kwargs:
        user[key] = kwargs[key]
    return user


def generate_league(year, active=True, hidden=False):
    return {
        'id': 'bc{}'.format(str(year)[-2:]),
        'name': 'Battlecode {}'.format(year),
        'start_date': '{}-01-01'.format(year),
        'end_date': '{}-02-01'.format(year),
        'active': active,
        'hidden': hidden,
    }


class UserTestCase(test.APITransactionTestCase):
    def setUp(self):
        self.client = test.APIClient()

        # Create two regular users
        self.client.post('/api/user/', generate_user(6147), format='json')
        self.client.post('/api/user/', generate_user(6370), format='json')
        self.userA = get_user_model().objects.get(email='user_6147@battlecode.org')
        self.userB = get_user_model().objects.get(email='user_6370@battlecode.org')

    def test_create_user_success(self):
        # Can create valid user even when not logged in
        user = generate_user(0)
        response = self.client.post('/api/user/', user, format='json')
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(content.get('email'), user['email'])
        self.assertEqual(content.get('date_of_birth'), user['date_of_birth'])
        self.assertEqual(content.get('first_name'), user['first_name'])
        self.assertEqual(content.get('last_name'), user['last_name'])

        # Recursive user profile data was updated
        self.assertEqual(content.get('userprofile').get('country'), user['userprofile']['country'])
        self.assertEqual(content.get('userprofile').get('username'), user['userprofile']['username'])

        # Password and token are not returned to the user.
        # In the db, password is hashed, token is auto-generated
        self.assertTrue('password' not in content)
        self.assertTrue('registration_key' not in content)
        db_user = get_user_model().objects.get(email=user['email'])
        self.assertNotEqual(db_user.password, user['password'])
        self.assertTrue(db_user.registration_key)

    def test_cannot_override_some_fields_on_creation(self):
        # Cannot override registration key nor avatar on creation
        user = generate_user(1, registration_key='FOOBAR')
        user['userprofile']['avatar'] = 'FOOBAR'
        response = self.client.post('/api/user/', user, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        db_user = get_user_model().objects.get(email=user['email'])
        self.assertNotEqual(db_user.registration_key, user['registration_key'])
        self.assertNotEqual(db_user.userprofile.avatar, user['userprofile']['avatar'])

    def test_cannot_create_user_with_missing_fields(self):
        user = generate_user(0)
        del user['userprofile']['username']
        response = self.client.post('/api/user/', user, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_create_duplicate_users(self):
        user = generate_user(0)
        response = self.client.post('/api/user/', user, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Cannot create users with the same username
        user = generate_user(0, email='robot@battlecode.org')
        response = self.client.post('/api/user/', user, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Nor with the same email
        user = generate_user(0)
        user['userprofile']['username'] = 'robot'
        response = self.client.post('/api/user/', user, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_detail_user(self):
        # Anonymous users cannot access private user info
        response = self.client.get('/api/user/{}/'.format(self.userA.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Logged in user A can access private user info about user A
        self.client.force_authenticate(user=self.userA)
        response = self.client.get('/api/user/{}/'.format(self.userA.id))
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(content.get('email'), self.userA.email)
        self.assertEqual(content.get('first_name'), self.userA.first_name)
        self.assertEqual(content.get('last_name'), self.userA.last_name)
        self.assertTrue('registration_key' not in content)
        self.assertTrue('password' not in content)

        # And also public user info about user A
        self.assertTrue('userprofile' in content)
        self.assertEqual(content.get('userprofile').get('country'), self.userA.userprofile.country)
        self.assertEqual(content.get('userprofile').get('bio'), self.userA.userprofile.bio)
        self.assertEqual(content.get('userprofile').get('username'), self.userA.userprofile.username)
        self.assertEqual(content.get('userprofile').get('avatar'), '')

        # But User A is not allowed to access private user info about user B
        response = self.client.get('/api/user/{}/'.format(self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Cannot detail invalid user
        response = self.client.get('/api/user/6452/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_user_success(self):
        self.client.force_authenticate(user=self.userA)
        response = self.client.get('/api/user/{}/'.format(self.userA.id))
        user = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user['first_name'] = 'Teh'
        user['last_name'] = 'Devs'
        user['userprofile']['avatar'] = 'FOOBAR'
        user['userprofile']['bio'] = 'Hello'
        user['userprofile']['country'] = 'Canada'
        user['email'] = 'jsegaran@mit.edu'
        user['password'] = 'FOOBAR'

        response = self.client.put('/api/user/{}/'.format(self.userA.id), user, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Logged in user can modify first name, last name, DOB, bio, country
        content = json.loads(response.content)
        self.assertEqual(content.get('first_name'), user['first_name'])
        self.assertEqual(content.get('last_name'), user['last_name'])
        self.assertEqual(content.get('userprofile').get('bio'), user['userprofile']['bio'])
        self.assertEqual(content.get('userprofile').get('country'), user['userprofile']['country'])

        # Cannot modify email, password, avatar
        self.assertNotEqual(content.get('email'), user['email'])
        self.assertNotEqual(content.get('password'), user['password'])
        self.assertNotEqual(content.get('userprofile').get('avatar'), user['userprofile']['avatar'])

    def test_put_user_fail(self):
        self.client.force_authenticate(user=self.userB)
        response = self.client.get('/api/user/{}/'.format(self.userB.id))
        user = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        new_first_name = 'Teh'
        new_last_name = 'Devs'

        # Put can fail if not logged in as the requested user
        self.client.force_authenticate(user=self.userA)
        user['first_name'] = new_first_name
        user['last_name'] = new_last_name
        response = self.client.put('/api/user/{}/'.format(self.userB.id), user, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Or if not all required fields are provided
        put_dict = {'first_name': new_first_name, 'last_name': new_last_name}
        response = self.client.put('/api/user/{}/'.format(self.userA.id), put_dict)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Check that nothing was modified
        self.client.force_authenticate(user=self.userB)
        response = self.client.get('/api/user/{}/'.format(self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        content = json.loads(response.content)
        self.assertNotEqual(content.get('first_name'), new_first_name)
        self.assertNotEqual(content.get('last_name'), new_last_name)

    def test_patch_user_success(self):
        # Test that you can modify without sending the entire dict across just
        # the fields that should be modified. Also include a bad field that
        # should not be used
        self.client.force_authenticate(user=self.userA)

        patch_dict = { 'userprofile': { 'bio': 'jsegaran@mit.edu' }, 'password': 'password'}
        response = self.client.patch('/api/user/{}/'.format(self.userA.id), patch_dict, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        db_user = get_user_model().objects.get(pk=self.userA.id)
        self.assertEqual(db_user.userprofile.bio, patch_dict['userprofile']['bio'])
        self.assertNotEqual(db_user.password, patch_dict['password'])

    def test_patch_user_fail(self):
        # Patch can fail if not logged in as the requested user
        patch_dict = { 'first_name': 'Teh' }
        response = self.client.patch('/api/user/{}/'.format(self.userA.id), patch_dict, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        db_user = get_user_model().objects.get(pk=self.userA.id)
        self.assertNotEqual(db_user.first_name, patch_dict['first_name'])

    def test_delete_user(self):
        # Cannot delete users when I am not logged in.
        response = self.client.delete('/api/user/{}/'.format(self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        response = self.client.get('/api/user/profile/{}/'.format(self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Nor can I delete users that are not myself.
        self.client.force_authenticate(user=self.userA)
        response = self.client.delete('/api/user/{}/'.format(self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.get('/api/user/profile/{}/'.format(self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Can delete myself.
        response = self.client.delete('/api/user/{}/'.format(self.userA.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        response = self.client.get('/api/user/profile/{}/'.format(self.userA.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_detail_user_profile(self):
        # Can detail anyone's user profile, but only if it exists
        response = self.client.get('/api/user/profile/{}/'.format(self.userA.id + self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        response = self.client.get('/api/user/profile/{}/'.format(self.userA.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # A user profile contains the following fields
        fields = ['username', 'avatar', 'bio', 'country']
        content = json.loads(response.content)
        for field in fields:
            self.assertTrue(field in content, field)

        # Can also list everyone's user profiles
        response = self.client.get('/api/user/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = json.loads(response.content)
        self.assertEqual(content['count'], 2)

        # No HTTP methods other than GET exist
        self.assertEqual(self.client.delete('/api/user/profile/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.post('/api/user/profile/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.put('/api/user/profile/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.patch('/api/user/profile/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class LeagueTestCase(test.APITestCase):
    def setUp(self):
        self.client = test.APIClient()
        self.bc16 = League.objects.create(**generate_league(2016, active=False, hidden=False))
        self.bc17 = League.objects.create(**generate_league(2017, active=True, hidden=False))
        self.bc18 = League.objects.create(**generate_league(2018, active=True, hidden=True))

    def test_list(self):
        response = self.client.get('/api/league/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'GET /api/league/ is OK')
        content = json.loads(response.content)
        self.assertEqual(content['count'], 2, 'Expected 2 non-hidden leagues')

        fields = ['name', 'id', 'start_date', 'end_date', 'active']
        codes = ['bc16', 'bc17']
        for league in content['results']:
            for field in fields:
                self.assertTrue(field in league, '{} {}'.format(field, league))
            self.assertFalse('hidden' in league, league)
            self.assertTrue(league['id'] in codes, league)

        self.assertEqual(self.client.delete('/api/league/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.post('/api/league/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.put('/api/league/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.patch('/api/league/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_detail(self):
        response = self.client.get('/api/league/bc16/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Can get inactive league')
        response = self.client.get('/api/league/bc17/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Can get active league')
        response = self.client.get('/api/league/bc18/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Cannot get hidden league')
        response = self.client.get('/api/league/bc19/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Cannot get noexistent league')

        self.assertEqual(self.client.delete('/api/league/bc16/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.post('/api/league/bc16/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.put('/api/league/bc16/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.patch('/api/league/bc16/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class TeamTestCase(test.APITransactionTestCase):
    def setUp(self):
        self.client = test.APIClient()
        self.bc17 = League.objects.create(**generate_league(2017))
        self.bc18 = League.objects.create(**generate_league(2018))
        self.bc19 = League.objects.create(**generate_league(2019, active=False))

        self.client.post('/api/user/', generate_user(1), format='json')
        self.client.post('/api/user/', generate_user(2), format='json')
        self.client.post('/api/user/', generate_user(3), format='json')
        self.userA = get_user_model().objects.get(email='user_1@battlecode.org')
        self.userB = get_user_model().objects.get(email='user_2@battlecode.org')
        self.userC = get_user_model().objects.get(email='user_3@battlecode.org')

        self.client.force_authenticate(user=self.userC)
        response = self.client.post('/api/bc17/team/', {'name': 'TestTeam1'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post('/api/bc18/team/', {'name': 'TestTeam2'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.team1 = Team.objects.get(name='TestTeam1')
        self.team2 = Team.objects.get(name='TestTeam2')
        self.team3 = Team.objects.create(league=self.bc17, name='TestTeam3', team_key='asdf', deleted=True)
        self.client.force_authenticate(user=None)

    def test_create_success(self):
        self.client.force_authenticate(user=self.userA)
        response = self.client.post('/api/bc18/team/', {'name': 'TeamName'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, 'Created team')
        content = json.loads(response.content)

        self.assertTrue('bc18' in content.get('league'), 'Expected parameters to be maintained')
        self.assertEqual(content.get('name'), 'TeamName', 'Expected parameters to be maintained')
        self.assertEqual(content.get('auto_accept_ranked'), False, 'Expected default value')
        self.assertEqual(content.get('auto_accept_unranked'), False, 'Expected default value')

        users = content.get('users')
        self.assertTrue(self.userA.id in users, 'User A auto-joined team: {}'.format(users))

        db_team = Team.objects.get(name='TeamName')
        self.assertTrue(db_team.team_key, 'Team key should be auto-generated: {}'.format(db_team.team_key))

        for field in ['id', 'avatar', 'bio', 'divisions']:
            self.assertTrue(field in content, 'Field {} should be returned'.format(field))
        for field in ['mu', 'sigma', 'deleted']:
            self.assertFalse(field in content, 'Field {} should NOT be returned'.format(field))

    def test_create_fail(self):
        response = self.client.post('/api/bc18/team/', {'name': 'TeamName'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, 'Must be logged in to create team')

        self.client.force_authenticate(user=self.userA)
        response = self.client.post('/api/bc18/team/', {'name': 'TeamName'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post('/api/bc18/team/', {'name': 'TeamNombre'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, 'Cannot create team when already on one')
        response = self.client.post('/api/bc19/team/', {'name': 'TeamName'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, 'Cannot create team in inactive league')
        response = self.client.post('/api/bc17/team/', {'name': 'TeamName'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, 'Can create a team in another active league')

        self.client.force_authenticate(user=self.userB)
        response = self.client.post('/api/bc18/team/', {'name': 'TeamName'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, 'Cannot create duplicate team name')

    def test_list(self):
        response = self.client.get('/api/bc17/team/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = json.loads(response.content)
        self.assertEqual(content['count'], 1, 'Expected 1 team, deleted teams not returned')

    def test_detail(self):
        response = self.client.get('/api/bc17/team/{}/'.format(self.team1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get('/api/bc18/team/{}/'.format(self.team2.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # from nose.tools import set_trace; set_trace()
        self.assertFalse('team_key' in json.loads(response.content), 'Team key not returned if not authenticated')

        self.client.force_authenticate(user=self.userC)
        response = self.client.get('/api/bc18/team/{}/'.format(self.team2.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('team_key' in json.loads(response.content), 'Team key returned if authenticated')

        response = self.client.get('/api/bc17/team/{}/'.format(self.team2.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'League and team id mismatch')
        response = self.client.get('/api/bc17/team/{}/'.format(self.team3.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Deleted team not returned')
