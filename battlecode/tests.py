import json

from django.contrib.auth import get_user_model
from rest_framework import status, test


class TokenTestCase(test.APITestCase):
    def setUp(self):
        user = {
            'email': 'hello@battlecode.org',
            'username': 'hello',
            'password': 'password',
            'date_of_birth': '2018-01-01',
            'first_name': 'battle',
            'last_name': 'code',
        }

        self.client = test.APIClient()
        res = self.client.post('/api/user/', user, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_invalid_credentials(self):
        data = {
            'email': 'hello@battlecode.org',
            'password': 'idk',
        }

        res = self.client.post('/auth/token/', data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify(self):
        data = {
            'email': 'hello@battlecode.org',
            'password': 'password',
        }

        res = self.client.post('/auth/token/', data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        content = json.loads(res.content)
        refresh = content.get('refresh')
        access = content.get('access')
        res = self.client.post('/auth/token/verify/', {'token': refresh})
        self.assertEqual(res.status_code, status.HTTP_200_OK, 'Verify refresh token')
        res = self.client.post('/auth/token/verify/', {'token': access})
        self.assertEqual(res.status_code, status.HTTP_200_OK, 'Verify access token')
        res = self.client.post('/auth/token/verify/', {'token': 'asdf'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED, 'Invalid token')

    def test_refresh(self):
        data = {
            'email': 'hello@battlecode.org',
            'password': 'password',
        }

        res = self.client.post('/auth/token/', data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        content = json.loads(res.content)
        refresh = content.get('refresh')
        access1 = content.get('access')
        res = self.client.post('/auth/token/refresh/', {'refresh': refresh})
        self.assertEqual(res.status_code, status.HTTP_200_OK, 'New access token')

        content = json.loads(res.content)
        access2 = content.get('access')
        self.assertNotEqual(access1, access2, 'Access tokens are different')
        res = self.client.post('/auth/token/verify/', {'token': access2})
        self.assertEqual(res.status_code, status.HTTP_200_OK, 'Verify access token')

    def test_make_authenticated_request(self):
        user = get_user_model().objects.get(email='hello@battlecode.org')
        url = '/api/user/{}/'.format(user.id)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED, 'No credentials')

        data = {
            'email': 'hello@battlecode.org',
            'password': 'password',
        }

        res = self.client.post('/auth/token/', data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        token = json.loads(res.content).get('access')

        self.client.credentials(HTTP_AUTHORIZATION='Bearer {}'.format(token))
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK, 'Access token in header')
