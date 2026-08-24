from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Habit, HabitCompletion, JournalEntry


class AuthenticationTests(APITestCase):
    def test_signup_returns_token_and_user(self):
        response = self.client.post(
            reverse('signup'),
            {
                'email': 'student@example.com',
                'password': 'strong-test-password',
                'full_name': 'Test Student',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'student@example.com')

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            reverse('login'),
            {'email': 'missing@example.com', 'password': 'incorrect'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserDataTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='student@example.com',
            email='student@example.com',
            password='strong-test-password',
        )
        self.client.force_authenticate(self.user)

    def test_habit_completion_can_be_added_and_removed(self):
        habit = Habit.objects.create(user=self.user, title='Read')
        url = reverse('habit-toggle-completion', args=[habit.pk])

        added = self.client.post(url, {'date': '2026-08-24'}, format='json')
        self.assertEqual(added.status_code, status.HTTP_201_CREATED)
        self.assertTrue(HabitCompletion.objects.filter(habit=habit).exists())

        removed = self.client.post(url, {'date': '2026-08-24'}, format='json')
        self.assertEqual(removed.status_code, status.HTTP_200_OK)
        self.assertFalse(HabitCompletion.objects.filter(habit=habit).exists())

    def test_user_cannot_delete_another_users_journal_entry(self):
        other_user = get_user_model().objects.create_user(
            username='other@example.com',
            email='other@example.com',
            password='strong-test-password',
        )
        entry = JournalEntry.objects.create(
            user=other_user,
            title='Private entry',
            content='Only the owner should see this.',
        )

        response = self.client.delete(reverse('journal-detail', args=[entry.pk]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(JournalEntry.objects.filter(pk=entry.pk).exists())
