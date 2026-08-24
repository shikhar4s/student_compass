from unittest.mock import ANY, patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Conversation, Habit, HabitCompletion, JournalEntry, Message, Mood


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

    @patch('api.views.genai.GenerativeModel')
    def test_aura_uses_current_gemini_model_and_returns_ai_reply(self, mock_model):
        mood = Mood.objects.create(user=self.user, mood_type='Happy')
        conversation = Conversation.objects.create(user=self.user, mood=mood)
        Message.objects.create(conversation=conversation, role='assistant', content='How are you feeling?')
        mock_model.return_value.start_chat.return_value.send_message.return_value.text = 'I am here with you.'

        response = self.client.post(
            reverse('conversation-manage-messages', args=[conversation.pk]),
            {'content': 'I had a good day.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_model.assert_called_once_with('models/gemini-3.6-flash', system_instruction=ANY)
        self.assertEqual(response.data[-1]['content'], 'I am here with you.')

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

    def test_private_journal_requires_password_and_hides_content(self):
        url = reverse('journal-list')
        missing_password = self.client.post(
            url,
            {'title': 'Private thought', 'content': 'A protected reflection', 'is_locked': True},
            format='json',
        )
        self.assertEqual(missing_password.status_code, status.HTTP_400_BAD_REQUEST)

        created = self.client.post(
            url,
            {
                'title': 'Private thought',
                'content': 'A protected reflection',
                'is_locked': True,
                'lock_password': '4321',
            },
            format='json',
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created.data['content'], '')
        self.assertNotIn('lock_password', created.data)
        self.assertNotIn('lock_password_hash', created.data)

        entry = JournalEntry.objects.get(pk=created.data['id'])
        self.assertNotEqual(entry.lock_password_hash, '4321')

        listed = self.client.get(url)
        self.assertEqual(listed.data[0]['content'], '')
        self.assertFalse(listed.data[0]['is_unlocked'])

    def test_private_journal_unlock_checks_password(self):
        created = self.client.post(
            reverse('journal-list'),
            {
                'title': 'Private thought',
                'content': 'A protected reflection',
                'is_locked': True,
                'lock_password': '4321',
            },
            format='json',
        )
        unlock_url = reverse('journal-unlock', args=[created.data['id']])

        rejected = self.client.post(unlock_url, {'password': 'wrong'}, format='json')
        self.assertEqual(rejected.status_code, status.HTTP_400_BAD_REQUEST)

        unlocked = self.client.post(unlock_url, {'password': '4321'}, format='json')
        self.assertEqual(unlocked.status_code, status.HTTP_200_OK)
        self.assertEqual(unlocked.data['content'], 'A protected reflection')
        self.assertTrue(unlocked.data['is_unlocked'])

    def test_legacy_locked_journal_stays_locked_and_can_be_upgraded(self):
        entry = JournalEntry.objects.create(
            user=self.user,
            title='Legacy private entry',
            content='Content from before journal passwords existed.',
            is_locked=True,
        )

        listed = self.client.get(reverse('journal-list'))
        self.assertTrue(listed.data[0]['is_locked'])
        self.assertTrue(listed.data[0]['is_unlocked'])
        self.assertEqual(listed.data[0]['content'], entry.content)

        upgraded = self.client.patch(
            reverse('journal-detail', args=[entry.pk]),
            {
                'title': entry.title,
                'content': entry.content,
                'is_locked': True,
                'lock_password': '2468',
            },
            format='json',
        )
        self.assertEqual(upgraded.status_code, status.HTTP_200_OK)
        self.assertEqual(upgraded.data['content'], '')

        entry.refresh_from_db()
        self.assertTrue(entry.lock_password_hash)
