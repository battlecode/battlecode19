import json
import sys
import logging

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .views import *
from .models import *


class UserTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()

        # Create two regular users
        self.userA = get_user_model().objects.create_user(**self.generate_user(6147))
        self.userB = get_user_model().objects.create_user(**self.generate_user(6370))


    def generate_user(self, id_num, **kwargs):
        user = {
            'email': 'test{}@battlecode.org'.format(id_num),
            'password': 'password',
            'username': 'test{}'.format(id_num),
            'date_of_birth': '2018-01-01',
            'first_name': 'battle',
            'last_name': 'code',
        }

        for key in kwargs:
            user[key] = kwargs[key]
        return user


    def test_create_user_success(self):
        # Can create valid user even when not logged in
        user = self.generate_user(0)
        response = self.client.post('/api/user/', user)
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(content.get('username'), user['username'])
        self.assertEqual(content.get('country'), '')

        # Password and token are not returned to the user.
        # In the db, password is hashed, token is auto-generated
        self.assertTrue('password' not in content)
        self.assertTrue('registration_key' not in content)
        db_user = get_user_model().objects.get(email=user['email'])
        self.assertNotEqual(db_user.password, user['password'])
        self.assertTrue(db_user.registration_key)


    def test_can_only_override_certain_fields_on_creation(self):
        # Can override optional field country
        user = self.generate_user(1, country='USA')
        response = self.client.post('/api/user/', user)
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(content.get('country'), 'USA')

        # Cannot override registration key field on creation
        user = self.generate_user(2, registration_key='key')
        response = self.client.post('/api/user/', user)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        db_user = get_user_model().objects.get(email=user['email'])
        self.assertNotEqual(db_user.registration_key, user['registration_key'])


    def test_cannot_create_user_with_missing_fields(self):
        user = self.generate_user(0)
        del user['username']
        response = self.client.post('/api/user/', user)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_create_duplicate_users(self):
        user = self.generate_user(0)
        response = self.client.post('/api/user/', user)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Cannot create users with the same username
        user = self.generate_user(0, email='robot@battlecode.org')
        response = self.client.post('/api/user/', user)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Nor with the same email
        user = self.generate_user(0, username='robot')
        response = self.client.post('/api/user/', user)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_detail_user_logged_in(self):
        # Logged in user A can access all info about user A
        self.client.force_authenticate(user=self.userA)
        response = self.client.get('/api/user/{}/'.format(self.userA.id))
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Can access certain fields
        self.assertEqual(content.get('email'), self.userA.email)
        self.assertEqual(content.get('username'), self.userA.username)
        self.assertEqual(content.get('first_name'), self.userA.first_name)
        self.assertEqual(content.get('last_name'), self.userA.last_name)
        self.assertEqual(content.get('date_of_birth'), self.userA.date_of_birth)
        self.assertEqual(content.get('bio'), '')
        self.assertEqual(content.get('avatar'), None)
        self.assertEqual(content.get('country'), '')

        # But not others
        self.assertTrue('registration_key' not in content)
        self.assertTrue('password' not in content)


    def test_detail_user_not_logged_in(self):
        # Logged in user can only access public info about another user
        self.client.force_authenticate(user=self.userA)
        response = self.client.get('/api/user/{}/'.format(self.userB.id))
        content = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Can access certain fields
        self.assertEqual(content.get('username'), self.userB.username)
        self.assertEqual(content.get('bio'), '')
        self.assertEqual(content.get('avatar'), None)
        self.assertEqual(content.get('country'), '')

        # But not others
        hidden = ['first_name', 'last_name', 'email', 'date_of_birth', 'registration_key', 'password']
        for field in hidden:
            self.assertTrue(field not in content, field)

    def test_get_invalid_user(self):
        response = self.client.get('/api/user/6452/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_modify_user_logged_in(self):
        # Test good modify for user log in
        self.client.force_authenticate(user=self.userA)

        new_first_name = 'Teh'
        new_last_name = 'Devs'
        self.userA.first_name = new_first_name
        self.userA.last_name = new_last_name
        response = self.client.put('/api/user/{}/'.format(self.userA.id),
                self.userA.__dict__)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get('/api/user/{}/'.format(self.userA.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        content = json.loads(response.content)
        self.assertEqual(content.get('first_name'), new_first_name)
        self.assertEqual(content.get('last_name'), new_last_name)

    def test_no_modify_email_password(self):
        # Test good modify for user log in
        temp_user = get_user_model().objects.create_user(**self.generate_user(6172))
        self.client.force_authenticate(user=temp_user)

        put_dict = temp_user.__dict__.copy()
        put_dict['email'] = 'jsegaran@mit.edu'
        response = self.client.put('/api/user/{}/'.format(temp_user.id),
                put_dict)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get('/api/user/{}/'.format(temp_user.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        content = json.loads(response.content)
        self.assertEqual(content.get('email'), temp_user.email)


    def test_modify_user_not_logged_in(self):
        # Test good modify for user log in
        self.client.force_authenticate(user=self.userA)

        new_first_name = 'Teh'
        new_last_name = 'Devs'

        self.userB.first_name = new_first_name
        self.userB.last_name = new_last_name

        response = self.client.put('/api/user/{}/'.format(self.userB.id),
                self.userB.__dict__)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.userB)
        response = self.client.get('/api/user/{}/'.format(self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        content = json.loads(response.content)
        self.assertNotEqual(content.get('first_name'), new_first_name)
        self.assertNotEqual(content.get('last_name'), new_last_name)

        # Resync userB to default

    def test_modify_incomplete(self):
        # Test good modify for user log in
        self.client.force_authenticate(user=self.userA)

        new_first_name = 'Teh'
        new_last_name = 'Devs'

        put_dict = {'first_name': new_first_name, 'last_name': new_last_name}

        response = self.client.put('/api/user/{}/'.format(self.userA.id),
                put_dict)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(user=self.userB)
        response = self.client.get('/api/user/{}/'.format(self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        content = json.loads(response.content)
        self.assertNotEqual(content.get('first_name'), new_first_name)
        self.assertNotEqual(content.get('last_name'), new_last_name)

        # Resync userB to default

    def test_patch_modify_user_logged_in(self):
        # Test that you can modify without sending the entire dict across just
        # the fields that should be modified. Also include a bad field that
        # should not be used
        temp_user = get_user_model().objects.create_user(**self.generate_user(6172))
        self.client.force_authenticate(user=temp_user)

        put_dict = {'bio': 'jsegaran@mit.edu', 'password': 'password'}
        response = self.client.patch('/api/user/{}/'.format(temp_user.id),
                put_dict)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = json.loads(response.content)

        self.assertEqual(content.get('bio'), put_dict['bio'])
        self.assertFalse('password' in content)

    def test_patch_modify_user_not_logged_in(self):
        # Test that you can modify without sending the entire dict across just
        # the fields that should be modified. Also include a bad field that
        # should not be used
        temp_user = get_user_model().objects.create_user(**self.generate_user(6172))
        self.client.force_authenticate(user=self.userB)

        put_dict = {'bio': 'jsegaran@mit.edu', 'password': 'password'}
        response = self.client.patch('/api/user/{}/'.format(temp_user.id),
                put_dict)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=temp_user)

        response = self.client.get('/api/user/{}/'.format(self.userB.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        content = json.loads(response.content)
        self.assertNotEqual(content.get('bio'), put_dict['bio'])
