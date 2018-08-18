import json
import sys
import logging

from django.contrib.auth import get_user_model
from rest_framework import status, test

from api.views import *
from api.models import *


def generate_user(id_num, **kwargs):
    user = {
        'email': 'user_{}@battlecode.org'.format(id_num),
        'password': 'password',
        'date_of_birth': '2018-01-01',
        'first_name': 'battle',
        'last_name': 'code',
        'username': 'user_{}'.format(id_num),
        'country': 'USA',
    }

    for key in kwargs:
        user[key] = kwargs[key]
    return user


def generate_league(year, active=True, submissions_enabled=True):
    return {
        'id': 'bc{}'.format(str(year)[-2:]),
        'name': 'Battlecode {}'.format(year),
        'start_date': '{}-01-01'.format(year),
        'end_date': '{}-02-01'.format(year),
        'active': active,
        'submissions_enabled': submissions_enabled,
    }


def generate_submission(submission_num):
    return {
        'name': 'Submission {}'.format(submission_num),
        'data': 'attack(enemy)',
    }


def generate_map(id_num, league, hidden=False):
    return {
        'id': id_num,
        'league_id': league,
        'name': 'Map{} ({})'.format(id_num, league),
        'filename': '/{}/map/{}.json'.format(league, id_num),
        'hidden': hidden,
    }


def generate_scrimmage(red_team_id, blue_team_id, map_id, ranked=True):
    return {
        'red_team': red_team_id,
        'blue_team': blue_team_id,
        'map': map_id,
        'ranked': ranked,
    }


class UserTestCase(test.APITransactionTestCase):
    def setUp(self):
        self.client = test.APIClient()

        # Create two regular users
        self.client.post('/api/user/', generate_user(6147), format='json')
        res = self.client.post('/api/user/', generate_user(6370), format='json')
        self.userA = get_user_model().objects.get(username='user_6147')
        self.userB = get_user_model().objects.get(username='user_6370')

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
        self.assertEqual(content.get('country'), user['country'])
        self.assertEqual(content.get('username'), user['username'])

        # Password and token are not returned to the user.
        # In the db, password is hashed, token is auto-generated
        self.assertTrue('password' not in content)
        self.assertTrue('registration_key' not in content)
        db_user = get_user_model().objects.get(email=user['email'])
        self.assertNotEqual(db_user.password, user['password'])
        self.assertTrue(db_user.registration_key)

        # Login
        self.assertTrue(self.client.login(username='user_0@battlecode.org', password='password'))

    def test_cannot_override_some_fields_on_creation(self):
        # Cannot override registration key nor avatar on creation
        user = generate_user(1, registration_key='FOOBAR')
        user['avatar'] = 'FOOBAR'
        response = self.client.post('/api/user/', user, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        db_user = get_user_model().objects.get(email=user['email'])
        self.assertNotEqual(db_user.registration_key, user['registration_key'])
        self.assertNotEqual(db_user.avatar, user['avatar'])

    def test_cannot_create_user_with_missing_fields(self):
        user = generate_user(0)
        del user['username']
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
        user['username'] = 'robot'
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
        self.assertEqual(content.get('country'), self.userA.country)
        self.assertEqual(content.get('bio'), self.userA.bio)
        self.assertEqual(content.get('username'), self.userA.username)
        self.assertEqual(content.get('avatar'), '')

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
        user['avatar'] = 'FOOBAR'
        user['bio'] = 'Hello'
        user['country'] = 'Canada'
        user['email'] = 'jsegaran@mit.edu'
        user['password'] = 'FOOBAR'

        response = self.client.put('/api/user/{}/'.format(self.userA.id), user, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Logged in user can modify first name, last name, DOB, bio, country
        content = json.loads(response.content)
        self.assertEqual(content.get('first_name'), user['first_name'])
        self.assertEqual(content.get('last_name'), user['last_name'])
        self.assertEqual(content.get('bio'), user['bio'])
        self.assertEqual(content.get('country'), user['country'])

        # Cannot modify email, password, avatar
        self.assertNotEqual(content.get('email'), user['email'])
        self.assertNotEqual(content.get('password'), user['password'])
        self.assertNotEqual(content.get('avatar'), user['avatar'])

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

        patch_dict = { 'bio': 'jsegaran@mit.edu', 'password': 'password'}
        response = self.client.patch('/api/user/{}/'.format(self.userA.id), patch_dict, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        db_user = get_user_model().objects.get(pk=self.userA.id)
        self.assertEqual(db_user.bio, patch_dict['bio'])
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
        response = self.client.get('/api/user/profile/{}/'.format(self.userB.username))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Nor can I delete users that are not myself.
        self.client.force_authenticate(user=self.userA)
        response = self.client.delete('/api/user/{}/'.format(self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.get('/api/user/profile/{}/'.format(self.userB.username))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Can delete myself.
        response = self.client.delete('/api/user/{}/'.format(self.userA.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        response = self.client.get('/api/user/profile/{}/'.format(self.userA.username))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_detail_user_profile(self):
        # Can detail anyone's user profile, but only if it exists
        response = self.client.get('/api/user/profile/{}/'.format('asdf'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        response = self.client.get('/api/user/profile/{}/'.format(self.userA.username))
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
        self.bc16 = League.objects.create(**generate_league(2016, active=False))
        self.bc17 = League.objects.create(**generate_league(2017, active=True))

    def test_list(self):
        response = self.client.get('/api/league/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'GET /api/league/ is OK')
        content = json.loads(response.content)
        self.assertEqual(content['count'], 2, 'Expected 2 leagues')

        fields = ['name', 'start_date', 'end_date', 'active']
        ids = ['bc16', 'bc17']
        for league in content['results']:
            for field in fields:
                self.assertTrue(field in league, '{} {}'.format(field, league))
            url = league['url']
            self.assertTrue('bc16' in url or 'bc17' in url, league)

        self.assertEqual(self.client.delete('/api/league/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.post('/api/league/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.put('/api/league/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.patch('/api/league/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_detail(self):
        response = self.client.get('/api/league/bc16/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Can get inactive league')
        response = self.client.get('/api/league/bc17/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Can get active league')
        response = self.client.get('/api/league/bc19/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Cannot get nonexistent league')

    def test_methods_not_allowed(self):
        self.assertEqual(self.client.delete('/api/league/bc16/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.post('/api/league/bc16/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.put('/api/league/bc16/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.patch('/api/league/bc16/').status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class TeamTestCase(test.APITransactionTestCase):
    def setUp(self):
        self.client = test.APIClient()
        self.bc17 = League.objects.create(**generate_league(2017))
        self.bc18 = League.objects.create(**generate_league(2018))
        self.bc19 = League.objects.create(**generate_league(2019))

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
        response = self.client.post('/api/bc19/team/', {'name': 'TestTeam3'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.team1 = Team.objects.get(name='TestTeam1')
        self.team2 = Team.objects.get(name='TestTeam2')
        self.team3 = Team.objects.get(name='TestTeam3')
        self.team4 = Team.objects.create(league=self.bc17, name='TestTeam4', team_key='asdf', deleted=True)

        self.bc19.active = False
        self.bc19.save()
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
        self.assertEqual([self.userA.username], users, 'User A auto-joined team: {}'.format(users))

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
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, 'Cannot create team in inactive league')
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

        response = self.client.get('/api/bc19/team/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'RO methods of team from inactive league allowed')

    def test_detail(self):
        response = self.client.get('/api/bc17/team/{}/'.format(self.team1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get('/api/bc18/team/{}/'.format(self.team2.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse('team_key' in json.loads(response.content), 'Team key not returned if not authenticated')
        self.assertFalse('code' in json.loads(response.content), 'Code not returned if not authenticated')

        self.client.force_authenticate(user=self.userC)
        response = self.client.get('/api/bc18/team/{}/'.format(self.team2.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('team_key' in json.loads(response.content), 'Team key returned if authenticated')
        self.assertTrue('code' in json.loads(response.content), 'Code returned if authenticated')

        response = self.client.get('/api/bc17/team/{}/'.format(self.team2.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'League and team id mismatch')
        response = self.client.get('/api/bc17/team/{}/'.format(self.team4.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Deleted team not returned')

        response = self.client.get('/api/bc19/team/{}/'.format(self.team3.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'RO methods of team from inactive league allowed')

    def test_join(self):
        self.client.force_authenticate(user=self.userA)
        response = self.client.post('/api/bc17/team/', {'name': 'TeamName'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, 'Created team in bc17')

        # User A joins team 2
        response = self.client.patch('/api/bc17/team/{}/join/'.format(self.team1.id), {'team_key': self.team1.team_key})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, 'Cannot join team when already on one')
        response = self.client.patch('/api/bc18/team/{}/join/'.format(self.team2.id))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, 'Cannot join team without team key')
        response = self.client.patch('/api/bc18/team/{}/join/'.format(self.team2.id), {'team_key': ':)'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, 'Cannot join team with the wrong team key')
        response = self.client.patch('/api/bc19/team/{}/join/'.format(self.team3.id), {'team_key': self.team3.team_key})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, 'Cannot join team in inactive league')
        response = self.client.patch('/api/bc17/team/{}/join/'.format(self.team2.id), {'team_key': self.team2.team_key})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'League and team ID do not match')
        response = self.client.patch('/api/bc18/team/{}/join/'.format(self.team2.id), {'team_key': self.team2.team_key})
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Successfully joined team')
        content = json.loads(response.content)
        self.assertTrue(self.userA.username in content['users'], 'User A joins team 2')

        # User B joins team 2
        self.client.force_authenticate(user=self.userB)
        response = self.client.patch('/api/bc18/team/{}/join/'.format(self.team2.id), {'team_key': self.team2.team_key})

        # User D joins team 2
        self.client.post('/api/user/', generate_user(4), format='json')
        userD = get_user_model().objects.get(email='user_4@battlecode.org')
        self.client.force_authenticate(user=userD)
        response = self.client.patch('/api/bc18/team/{}/join/'.format(self.team2.id), {'team_key': self.team2.team_key})
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'User D joins team 2')

        # User E cannot join team 2
        self.client.post('/api/user/', generate_user(5), format='json')
        userE = get_user_model().objects.get(email='user_5@battlecode.org')
        self.client.force_authenticate(user=userE)
        response = self.client.patch('/api/bc18/team/{}/join/'.format(self.team2.id), {'team_key': self.team2.team_key})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, 'User E fails join, team at max capacity')

    def test_leave(self):
        url = '/api/bc18/team/{}/'.format(self.team2.id)

        # User A joins team
        self.client.force_authenticate(user=self.userA)
        response = self.client.patch('/api/bc18/team/{}/join/'.format(self.team2.id), {'team_key': self.team2.team_key})
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'User A joined team')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Team exists')
        self.assertEqual(len(json.loads(response.content).get('users')), 2, 'Users A and C')

        # User A leaves team
        response = self.client.patch('/api/bc17/team/{}/leave/'.format(self.team1.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, 'Cannot leave team I am not on')
        response = self.client.patch('/api/bc18/team/{}/leave/'.format(self.team2.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'User A left team')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Team exists')
        self.assertEqual(len(json.loads(response.content).get('users')), 1, 'User C')

        # User C leaves team, team gets deleted
        self.client.force_authenticate(user=self.userC)
        response = self.client.patch('/api/bc19/team/{}/leave/'.format(self.team3.id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, 'Cannot leave team in inactive league')
        response = self.client.patch('/api/bc18/team/{}/leave/'.format(self.team2.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'User C left team')
        response = self.client.get('/api/bc18/team/{}/'.format(self.team2.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Team deleted')

    def test_update(self):
        url = '/api/bc18/team/{}/'.format(self.team2.id)

        update = {
            'op': 'update',
            'bio': 'hello world',
            'divisions': ['highschool', 'newbie'],
            'auto_accept_unranked': True,
            'auto_accept_ranked': False,
            'code': "// I wrote some code",
        }
        response = self.client.patch(url, update)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, 'Unauthorized update')

        self.client.force_authenticate(user=self.userC)
        response = self.client.patch(url, update)
        content = json.loads(response.content)
        print(content)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Successful update')
        self.assertEqual(content['bio'], update['bio'])
        self.assertEqual(content['divisions'], update['divisions'])
        self.assertEqual(content['auto_accept_unranked'], update['auto_accept_unranked'])
        self.assertEqual(content['auto_accept_ranked'], update['auto_accept_ranked'])
        self.assertEqual(content['code'], update['code'])

        response = self.client.patch('/api/bc19/team/{}/'.format(self.team3.id), update)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, 'Cannot update team in inactive league')
        response = self.client.put(url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, 'PUT not allowed')


class SubmissionTestCase(test.APITestCase):
    def setUp(self):
        self.client = test.APIClient()

        # Create a league
        self.bc17 = League.objects.create(**generate_league(2017))
        self.bc18 = League.objects.create(**generate_league(2018))
        self.client.post('/api/user/', generate_user(1), format='json')
        self.client.post('/api/user/', generate_user(2), format='json')

        # Create a user
        self.userA = get_user_model().objects.get(email='user_1@battlecode.org')
        self.userB = get_user_model().objects.get(email='user_2@battlecode.org')

        # Create a team in the league
        self.client.force_authenticate(user=self.userA)
        response = self.client.post('/api/bc17/team/', {'name': 'TestTeam1'})
        self.teamA = Team.objects.get(name='TestTeam1')
        self.client.force_authenticate(user=self.userB)
        response = self.client.post('/api/bc17/team/', {'name': 'TestTeam2'})
        self.teamB = Team.objects.get(name='TestTeam2')
        self.client.force_authenticate(user=None)

    def test_create(self):
        # Authentication
        submission = generate_submission(1)
        response = self.client.post('/api/bc17/submission/', submission)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, 'Must be logged in')
        self.client.force_authenticate(user=self.userA)
        response = self.client.post('/api/bc18/submission/', submission)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, 'Must have a team in the league')
        response = self.client.post('/api/bc17/submission/', submission)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, 'Successfully submit')

        # Test correct fields returns
        fields = ['id', 'team', 'name', 'filename', 'submitted_at']
        content = json.loads(response.content)
        for field in fields:
            self.assertTrue(field in content, 'Field exists: {}'.format(field))

        # Test content of fields matches data submitted
        self.assertEqual(content['team'], self.teamA.id, 'Associated the correct team with the submission')
        self.assertEqual(content['name'], submission['name'], 'Submission name preserved')
        filename = '/{}/{}/{}.zip'.format(self.bc17.id, self.teamA.id, content['id'])
        self.assertEqual(content['filename'], filename, 'Correct filename format')

        # Test disabling submissions
        self.bc17.submissions_enabled = False
        self.bc17.save()
        response = self.client.post('/api/bc17/submission/', submission)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, 'Submissions disabled')

    def test_retrieve(self):
        # Create a submission
        self.client.force_authenticate(user=self.userA)
        response = self.client.post('/api/bc17/submission/', generate_submission(1))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission_id = json.loads(response.content)['id']

        url17 = '/api/bc17/submission/{}/'.format(submission_id)
        url18 = '/api/bc18/submission/{}/'.format(submission_id)

        # Authentication
        self.client.force_authenticate(user=None)
        response = self.client.get(url17)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, 'Must be logged in')
        self.client.force_authenticate(user=self.userA)
        response = self.client.get(url18)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, 'Must have a team in the league')
        response = self.client.get('/api/bc17/submission/{}/'.format(submission_id + 1))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'League and submission id mismatch')

        # Normal retrieve
        response = self.client.get(url17)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Successfully retrieve')
        fields = ['id', 'team', 'name', 'filename', 'submitted_at']
        content = json.loads(response.content)
        for field in fields:
            self.assertTrue(field in content, 'Field exists: {}'.format(field))

        # Change properties of the league
        self.bc17.submissions_enabled = False
        self.bc17.save()
        response = self.client.get(url17)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Successfully retrieve when submissions disabled')
        self.bc17.active = False
        self.bc17.save()
        response = self.client.get(url17)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Successfully retrieve when league inactive')

    def test_list(self):
        url17 = '/api/bc17/submission/'
        url18 = '/api/bc18/submission/'

        # Authentication
        response = self.client.get(url17)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, 'Must be logged in')
        self.client.force_authenticate(user=self.userA)
        response = self.client.get(url18)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, 'Must have a team in the league')

        # Create some submissions
        response = self.client.post(url17, generate_submission(1))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(url17, generate_submission(2))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(url17, generate_submission(3))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Normal listing
        response = self.client.get(url17)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Successfully list')
        self.assertEqual(json.loads(response.content)['count'], 3, 'Expected 3 submissions')

        # Change properties of the league
        self.bc17.submissions_enabled = False
        self.bc17.save()
        response = self.client.get(url17)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Successfully list when submissions disabled')
        self.bc17.active = False
        self.bc17.save()
        response = self.client.get(url17)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Successfully list when league inactive')

    def test_latest(self):
        self.client.force_authenticate(user=self.userA)
        url = '/api/bc17/submission/latest/'
        create_url = '/api/bc17/submission/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'No submissions found')

        response = self.client.post(create_url, generate_submission(1))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(create_url, generate_submission(2))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.post(create_url, generate_submission(3))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission_id = json.loads(response.content)['id']

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Submission found')
        self.assertEqual(json.loads(response.content).get('id'), submission_id, 'Submission is latest submission')


class MapTestCase(test.APITestCase):
    def setUp(self):
        self.client = test.APIClient()
        self.bc17 = League.objects.create(**generate_league(2017))
        self.bc18 = League.objects.create(**generate_league(2018))

        Map.objects.create(**generate_map(1, 'bc17'))
        Map.objects.create(**generate_map(2, 'bc17'))
        Map.objects.create(**generate_map(3, 'bc17'))
        Map.objects.create(**generate_map(4, 'bc18'))
        Map.objects.create(**generate_map(5, 'bc18', hidden=True))

    def test_retrieve(self):
        response = self.client.get('/api/bc17/map/1/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Successfully retrieve')

        fields = ['id', 'league', 'name', 'filename']
        no_fields = ['hidden']
        content = json.loads(response.content)
        for field in fields:
            self.assertTrue(field in content, 'Field exists: {}'.format(field))
        for field in no_fields:
            self.assertFalse(field in content, 'Field does not exist: {}'.format(field))

        self.bc18.active = False
        self.bc18.save()
        response = self.client.get('/api/bc18/map/4/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, 'Successfully retrieve when league inactive')

        response = self.client.get('/api/bc18/map/1/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'League and map id mismatch')
        response = self.client.get('/api/bc19/map/4/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, 'Nonexistent league')
        response = self.client.get('/api/bc18/map/5/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Hidden map not found')

    def test_list(self):
        response = self.client.get('/api/bc17/map/')
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(content['count'], 3, 'Expected 3 maps, deleted teams not returned')

        response = self.client.get('/api/bc18/map/')
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(content['count'], 1, 'Expected 1 map, hidden maps not returned')


class ScrimmageTestCase(test.APITestCase):
    def setUp(self):
        self.client = test.APIClient()

        # Create league and maps
        self.bc17 = League.objects.create(**generate_league(2017))
        self.bc18 = League.objects.create(**generate_league(2018))
        self.map1 = Map.objects.create(**generate_map(1, 'bc17'))
        self.map2 = Map.objects.create(**generate_map(2, 'bc18'))
        self.map3 = Map.objects.create(**generate_map(3, 'bc17', hidden=True))

        # Create users
        self.client.post('/api/user/', generate_user(1), format='json')
        self.client.post('/api/user/', generate_user(2), format='json')
        self.userA = get_user_model().objects.get(email='user_1@battlecode.org')
        self.userB = get_user_model().objects.get(email='user_2@battlecode.org')

        # Create teams and submissions
        self.client.force_authenticate(user=self.userA)
        self.client.post('/api/bc17/team/', {'name': 'TestTeam1'})
        self.teamA = Team.objects.get(name='TestTeam1')
        self.client.post('/api/bc17/submission/', generate_submission('A1'))
        self.client.post('/api/bc17/submission/', generate_submission('A2'))
        response = self.client.post('/api/bc17/submission/', generate_submission('A3'))

        self.submissionA = Submission.objects.get(id=json.loads(response.content).get('id'))

        self.client.force_authenticate(user=self.userB)
        self.client.post('/api/bc17/team/', {'name': 'TestTeam2'})
        response = self.client.post('/api/bc17/submission/', generate_submission('B1'))
        self.submissionB = Submission.objects.get(id=json.loads(response.content).get('id'))
        self.teamB = Team.objects.get(name='TestTeam2')
        self.client.force_authenticate(user=None)

    def test_permissions(self):
        url = '/api/bc17/scrimmage/'
        data = generate_scrimmage(self.teamA.id, self.teamB.id, self.map1.id)

        # Not logged in or not on a team
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED, 'Not logged in')
        self.client.force_authenticate(user=self.userA)
        self.assertEqual(self.client.get('/api/bc18/scrimmage/').status_code, status.HTTP_403_FORBIDDEN, 'No team')
        self.assertEqual(self.client.get('/api/bc18/scrimmage/1/').status_code, status.HTTP_403_FORBIDDEN, 'No team')

        # Active league: all endpoints allowed
        response = self.client.post(url, data)
        scrimmage_id = json.loads(response.content).get('id')
        url_detail = '/api/bc17/scrimmage/{}/'.format(scrimmage_id)
        self.assertEqual(self.client.post(url, data).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(url_detail).status_code, status.HTTP_200_OK)
        self.assertNotEqual(self.client.patch(url_detail + 'accept/').status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotEqual(self.client.patch(url_detail + 'reject/').status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotEqual(self.client.patch(url_detail + 'cancel/').status_code, status.HTTP_403_FORBIDDEN)

        # Inactive league: read-only endpoints only
        self.bc17.active = False
        self.bc17.save()
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(url_detail).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.post(url, data).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(url_detail + 'accept/').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(url_detail + 'reject/').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(url_detail + 'cancel/').status_code, status.HTTP_403_FORBIDDEN)

    def test_create_success(self):
        url = '/api/bc17/scrimmage/'

        # Request a scrimmage
        self.client.force_authenticate(user=self.userA)
        response = self.client.post(url, generate_scrimmage(self.teamA.id, self.teamA.id, self.map1.id))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        content = json.loads(response.content)

        # Test that the right content is returned
        self.assertEqual(content.get('red_team'), self.teamA.id)
        self.assertEqual(content.get('blue_team'), self.teamA.id)
        self.assertEqual(content.get('map'), self.map1.id)
        self.assertEqual(content.get('ranked'), True)

        fields = ['id', 'status', 'red_submission', 'blue_submission', 'replay', 'red_logs', 'blue_logs',
            'requested_by', 'requested_at', 'started_at', 'updated_at']
        for field in fields:
            self.assertTrue(field in content, 'Field exists: {}'.format(field))

    def test_requested_by(self):
        url = '/api/bc17/scrimmage/'
        self.client.force_authenticate(user=self.userA)
        response = self.client.post(url, generate_scrimmage(self.teamA.id, self.teamB.id, self.map1.id))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        content = json.loads(response.content)
        self.assertEqual(content['requested_by'], self.teamA.id)
        response = self.client.post(url, generate_scrimmage(self.teamB.id, self.teamA.id, self.map1.id))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        content = json.loads(response.content)
        self.assertEqual(content['requested_by'], self.teamA.id)

    def test_auto_accept_scrimmage(self):
        url = '/api/bc17/scrimmage/'
        ranked = generate_scrimmage(self.teamA.id, self.teamB.id, self.map1.id, ranked=True)
        unranked = generate_scrimmage(self.teamA.id, self.teamB.id, self.map1.id, ranked=False)
        self.client.force_authenticate(user=self.userA)

        self.assertEqual(json.loads(self.client.post(url, ranked).content).get('status'), 'pending')
        self.assertEqual(json.loads(self.client.post(url, unranked).content).get('status'), 'pending')

        self.teamB.auto_accept_ranked = True
        self.teamB.save()
        self.assertEqual(json.loads(self.client.post(url, ranked).content).get('status'), 'queued')
        self.assertEqual(json.loads(self.client.post(url, unranked).content).get('status'), 'pending')

        self.teamB.auto_accept_unranked = True
        self.teamB.save()
        self.assertEqual(json.loads(self.client.post(url, ranked).content).get('status'), 'queued')
        self.assertEqual(json.loads(self.client.post(url, unranked).content).get('status'), 'queued')

        self.teamB.auto_accept_ranked = False
        self.teamB.save()
        self.assertEqual(json.loads(self.client.post(url, ranked).content).get('status'), 'pending')
        self.assertEqual(json.loads(self.client.post(url, unranked).content).get('status'), 'queued')

    def test_most_recent_submission(self):
        url = '/api/bc17/scrimmage/'
        scrimmage = generate_scrimmage(self.teamB.id, self.teamA.id, self.map1.id, ranked=True)
        self.client.force_authenticate(user=self.userA)

        response = self.client.post(url, scrimmage)
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(content.get('status'), 'pending', 'Scrimmage was not auto accepted')
        self.assertIsNone(content.get('red_submission'), 'Red submission not set')
        self.assertIsNone(content.get('blue_submission'), 'Blue submission not set')

        self.teamB.auto_accept_ranked = True
        self.teamB.save()
        response = self.client.post(url, scrimmage)
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(content.get('status'), 'queued', 'Scrimmage was auto accepted')
        self.assertEqual(content.get('red_submission'), self.submissionB.id, 'Red submission set to only entry')
        self.assertEqual(content.get('blue_submission'), self.submissionA.id, 'Blue submission set to latest entry')

    def test_create_fail(self):
        url = '/api/bc17/scrimmage/'
        self.client.force_authenticate(user=self.userA)
        response = self.client.post(url, generate_scrimmage(self.teamA.id, self.teamB.id, self.map2.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Map in different league')
        response = self.client.post(url, generate_scrimmage(self.teamA.id, self.teamB.id, self.map3.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Map is hidden')

        # Generate a new team without any submissions
        self.client.post('/api/user/', generate_user(3), format='json')
        userC = get_user_model().objects.get(email='user_3@battlecode.org')
        self.client.force_authenticate(user=userC)
        self.client.post('/api/bc17/team/', {'name': 'TestTeam3'})
        teamC = Team.objects.get(name='TestTeam3')

        # Canont send nor receive scrimmage requests
        scrimmage = generate_scrimmage(self.teamA.id, teamC.id, self.map1.id)
        self.assertEqual(self.client.post('/api/bc17/scrimmage/', scrimmage).status_code, status.HTTP_400_BAD_REQUEST)
        self.client.force_authenticate(user=self.userA)
        self.assertEqual(self.client.post('/api/bc17/scrimmage/', scrimmage).status_code, status.HTTP_400_BAD_REQUEST)

        # Other failed requests
        response = self.client.post(url, generate_scrimmage(self.teamA.id, self.teamA.id + self.teamB.id, self.map1.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Team does not exist')
        response = self.client.post(url, generate_scrimmage(self.teamB.id, self.teamB.id, self.map1.id))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, 'Scrimmage does not involve my team')

        self.teamB.league = self.bc18
        self.teamB.save()
        response = self.client.post(url, generate_scrimmage(self.teamA.id, self.teamB.id, self.map1.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, 'Team in diferent league')

    def test_accept_reject_cancel(self):
        url = '/api/bc17/scrimmage/'
        scrimmage = generate_scrimmage(self.teamA.id, self.teamB.id, self.map1.id, ranked=True)

        # Send user B some scrimmages
        self.client.force_authenticate(user=self.userA)
        id_1 = json.loads(self.client.post(url, scrimmage).content).get('id')
        id_2 = json.loads(self.client.post(url, scrimmage).content).get('id')
        id_3 = json.loads(self.client.post(url, scrimmage).content).get('id')

        # User A tries to accept/reject/cancel outgoing scrimmages
        self.assertEqual(self.client.patch('{}{}/accept/'.format(url, id_1)).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.patch('{}{}/reject/'.format(url, id_1)).status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.patch('{}{}/cancel/'.format(url, id_1))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content).get('status'), 'cancelled')

        # User B tries to accept/reject/cancel incoming scrimmages
        self.client.force_authenticate(user=self.userB)
        self.assertEqual(self.client.patch('{}{}/cancel/'.format(url, id_2)).status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.patch('{}{}/reject/'.format(url, id_2))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content).get('status'), 'rejected')
        response = self.client.patch('{}{}/accept/'.format(url, id_3))
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(content.get('status'), 'queued')
        self.assertEqual(content.get('red_submission'), self.submissionA.id)
        self.assertEqual(content.get('blue_submission'), self.submissionB.id)

    def test_list_retrieve(self):
        # Create team C
        self.client.post('/api/user/', generate_user(3), format='json')
        userC = get_user_model().objects.get(email='user_3@battlecode.org')
        self.client.force_authenticate(user=userC)
        self.client.post('/api/bc17/team/', {'name': 'TestTeam3'})
        response = self.client.post('/api/bc17/submission/', generate_submission('C1'))
        submissionC = Submission.objects.get(id=json.loads(response.content).get('id'))
        teamC = Team.objects.get(name='TestTeam3')

        # Send some scrimmages as user A
        self.client.force_authenticate(user=self.userA)
        url = '/api/bc17/scrimmage/'
        data = generate_scrimmage(self.teamA.id, self.teamB.id, self.map1.id)
        id_1 = json.loads(self.client.post(url, data).content).get('id')
        data = generate_scrimmage(self.teamB.id, self.teamA.id, self.map1.id)
        id_2 = json.loads(self.client.post(url, data).content).get('id')
        data = generate_scrimmage(teamC.id, self.teamA.id, self.map1.id)
        id_3 = json.loads(self.client.post(url, data).content).get('id')

        # User A list/retrieve
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content).get('count'), 3)
        self.assertEqual(self.client.get('{}{}/'.format(url, id_1)).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get('{}{}/'.format(url, id_2)).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get('{}{}/'.format(url, id_3)).status_code, status.HTTP_200_OK)

        # User B list/retrieve
        self.client.force_authenticate(user=self.userB)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content).get('count'), 2)
        self.assertEqual(self.client.get('{}{}/'.format(url, id_1)).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get('{}{}/'.format(url, id_2)).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get('{}{}/'.format(url, id_3)).status_code, status.HTTP_404_NOT_FOUND)

        # User C list/retrieve
        self.client.force_authenticate(user=userC)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(json.loads(response.content).get('count'), 1)
        self.assertEqual(self.client.get('{}{}/'.format(url, id_1)).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.get('{}{}/'.format(url, id_2)).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.get('{}{}/'.format(url, id_3)).status_code, status.HTTP_200_OK)


class TournamentTestCase(test.APITestCase):
    def setUp(self):
        self.client = test.APIClient()


class BracketTestCase(test.APITestCase):
    def setUp(self):
        self.client = test.APIClient()
