# Django Backend Setup Guide for Student Compass

This document provides complete instructions for setting up the Django backend that powers the Student Compass React frontend.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Initial Setup](#initial-setup)
3. [Database Models](#database-models)
4. [Authentication](#authentication)
5. [API Endpoints](#api-endpoints)
6. [Gemini AI Integration](#gemini-ai-integration)
7. [CORS Configuration](#cors-configuration)
8. [Running the Server](#running-the-server)

---

## Project Structure

```
student_compass_backend/
├── manage.py
├── requirements.txt
├── student_compass/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── api/
    ├── __init__.py
    ├── models.py
    ├── serializers.py
    ├── views.py
    ├── urls.py
    └── migrations/
```

---

## Initial Setup

### 1. Create Django Project

```bash
# Create project directory
mkdir student_compass_backend
cd student_compass_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Django and dependencies
pip install django djangorestframework django-cors-headers google-generativeai python-decouple

# Create Django project
django-admin startproject student_compass .

# Create API app
python manage.py startapp api
```

### 2. requirements.txt

```txt
Django==5.0.1
djangorestframework==3.14.0
django-cors-headers==4.3.1
google-generativeai==0.3.2
python-decouple==3.8
psycopg2-binary==2.9.9
```

### 3. Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your-django-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
GEMINI_API_KEY=your-gemini-api-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/student_compass
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

---

## Database Models

Create the following models in `api/models.py`:

```python
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    full_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email

class Mood(models.Model):
    MOOD_CHOICES = [
        ('Happy', 'Happy'),
        ('Sad', 'Sad'),
        ('Angry', 'Angry'),
        ('Depressed', 'Depressed'),
        ('Frustrated', 'Frustrated'),
        ('Disappointed', 'Disappointed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='moods')
    mood_type = models.CharField(max_length=20, choices=MOOD_CHOICES)
    intensity = models.IntegerField(default=3)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    mood = models.ForeignKey(Mood, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255, default='New Conversation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

class Message(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

class Habit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#3B82F6')
    icon = models.CharField(max_length=50, blank=True, null=True)
    target_days = models.IntegerField(default=7)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

class HabitCompletion(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='completions')
    completed_date = models.DateField()
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['habit', 'completed_date']
        ordering = ['-completed_date']

class JournalEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='journal_entries')
    title = models.CharField(max_length=255, default='Untitled Entry')
    content = models.TextField()
    sentiment = models.CharField(max_length=50, blank=True, null=True)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Journal entries'
```

---

## Authentication

### Update settings.py

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

AUTH_USER_MODEL = 'api.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### Create Serializers (api/serializers.py)

```python
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Mood, Conversation, Message, Habit, HabitCompletion, JournalEntry

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name']

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'full_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', '')
        )
        return user

class MoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mood
        fields = ['id', 'mood_type', 'intensity', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'created_at']

class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'mood', 'title', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class HabitCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitCompletion
        fields = ['id', 'completed_date', 'note', 'created_at']

class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = ['id', 'title', 'description', 'color', 'icon', 'target_days', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = ['id', 'title', 'content', 'sentiment', 'is_locked', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
```

---

## API Endpoints

### Create Views (api/views.py)

```python
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils import timezone
import google.generativeai as genai
from decouple import config
from .models import Mood, Conversation, Message, Habit, HabitCompletion, JournalEntry
from .serializers import (
    UserSerializer, SignupSerializer, MoodSerializer, ConversationSerializer,
    MessageSerializer, HabitSerializer, HabitCompletionSerializer, JournalEntrySerializer
)

# Configure Gemini
genai.configure(api_key=config('GEMINI_API_KEY'))

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    user = authenticate(username=email, password=password)

    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })
    return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    request.user.auth_token.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response(UserSerializer(request.user).data)

class MoodViewSet(viewsets.ModelViewSet):
    serializer_class = MoodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Mood.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        conversation = serializer.save(user=self.request.user)

        # Get mood type for initial message
        mood = conversation.mood
        mood_type = mood.mood_type if mood else 'neutral'

        # Create initial AI message
        initial_message = self.get_initial_message(mood_type)
        Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=initial_message
        )

    def get_initial_message(self, mood_type):
        messages = {
            'Happy': "That's wonderful! I'm so glad you're feeling happy today! What's bringing you joy?",
            'Sad': "I'm here for you. It's okay to feel sad sometimes. Would you like to talk about it?",
            'Angry': "I understand you're feeling angry. Let's work through this together. What's troubling you?",
            'Depressed': "I'm really sorry you're going through this. You're not alone. Would you like to share what's on your mind?",
            'Frustrated': "Frustration can be tough. I'm here to help. What's causing this frustration?",
            'Disappointed': "I hear you. Disappointment is hard. Let's talk about it. What didn't go as planned?",
        }
        return messages.get(mood_type, "Hello! I'm here to support you. How can I help you today?")

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        user_message = request.data.get('content')

        # Save user message
        Message.objects.create(
            conversation=conversation,
            role='user',
            content=user_message
        )

        # Generate AI response
        mood = conversation.mood
        mood_type = mood.mood_type if mood else 'neutral'
        system_prompt = self.get_system_prompt(mood_type)

        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(f"{system_prompt}\n\nUser: {user_message}")
            ai_response = response.text
        except Exception as e:
            ai_response = "I'm here to help you. Could you tell me more about what's on your mind?"

        # Save AI message
        Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=ai_response
        )

        # Return all messages
        messages = conversation.messages.all()
        return Response(MessageSerializer(messages, many=True).data)

    def get_system_prompt(self, mood_type):
        base = "You are an empathetic AI companion for students. Provide emotional support and guidance."
        prompts = {
            'Happy': f"{base} The student is happy. Celebrate their positive emotions.",
            'Sad': f"{base} The student is sad. Be gentle and compassionate.",
            'Angry': f"{base} The student is angry. Help them process their frustration.",
            'Depressed': f"{base} The student is depressed. Be extremely supportive.",
            'Frustrated': f"{base} The student is frustrated. Help them break down challenges.",
            'Disappointed': f"{base} The student is disappointed. Help them process setbacks.",
        }
        return prompts.get(mood_type, base)

class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def completions(self, request, pk=None):
        habit = self.get_object()
        completions = habit.completions.all()[:30]
        serializer = HabitCompletionSerializer(completions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_completion(self, request, pk=None):
        habit = self.get_object()
        date = request.data.get('date')

        completion, created = HabitCompletion.objects.get_or_create(
            habit=habit,
            completed_date=date
        )

        if not created:
            completion.delete()
            return Response({'status': 'removed'})

        return Response({'status': 'added'})

class JournalEntryViewSet(viewsets.ModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

### Create URLs (api/urls.py)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'moods', views.MoodViewSet, basename='mood')
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'habits', views.HabitViewSet, basename='habit')
router.register(r'journal', views.JournalEntryViewSet, basename='journal')

urlpatterns = [
    path('auth/signup/', views.signup, name='signup'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/me/', views.current_user, name='current-user'),
    path('', include(router.urls)),
]
```

### Update Main URLs (student_compass/urls.py)

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
```

---

## CORS Configuration

Add to `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True
```

---

## Running the Server

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate


# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

The backend will be available at: `http://localhost:8000/api/`

---

## API Endpoint Reference

### Authentication
- `POST /api/auth/signup/` - Create new user
- `POST /api/auth/login/` - Login user
- `POST /api/auth/logout/` - Logout user
- `GET /api/auth/me/` - Get current user

### Moods
- `GET /api/moods/` - List moods
- `POST /api/moods/` - Create mood
- `GET /api/moods/{id}/` - Get mood detail

### Conversations
- `GET /api/conversations/` - List conversations
- `POST /api/conversations/` - Create conversation
- `GET /api/conversations/{id}/messages/` - Get messages
- `POST /api/conversations/{id}/messages/` - Send message

### Habits
- `GET /api/habits/` - List habits
- `POST /api/habits/` - Create habit
- `PATCH /api/habits/{id}/` - Update habit
- `DELETE /api/habits/{id}/` - Delete habit
- `GET /api/habits/{id}/completions/` - Get completions
- `POST /api/habits/{id}/toggle_completion/` - Toggle completion

### Journal
- `GET /api/journal/` - List entries
- `POST /api/journal/` - Create entry
- `PATCH /api/journal/{id}/` - Update entry
- `DELETE /api/journal/{id}/` - Delete entry

---

## Testing the API

You can test the API using curl or Postman:

```bash
# Signup
curl -X POST http://localhost:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## Notes

- Make sure PostgreSQL is installed and running
- Get your Gemini API key from Google AI Studio
- Update the `.env` file with your credentials
- The React frontend is configured to connect to `http://localhost:8000/api`
- Token authentication is used for all protected endpoints
