import logging
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
import google.generativeai as genai
from decouple import config
from .models import Mood, Conversation, Message, Habit, HabitCompletion, JournalEntry
from .serializers import (
    UserSerializer, SignupSerializer, MoodSerializer, ConversationSerializer,
    MessageSerializer, HabitSerializer, HabitCompletionSerializer, JournalEntrySerializer
)
from google.generativeai import types


# Configure Gemini using the API key from your .env file
try:
    genai.configure(api_key=config('GEMINI_API_KEY'))
except Exception as e:
    logging.critical(f"GEMINI API KEY NOT FOUND OR INVALID: {e}. Please check your .env file.")

# Setup logging for better debugging
logger = logging.getLogger(__name__)

# --- Authentication Views (No changes needed) ---

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

# --- Main Application ViewSets ---

class MoodViewSet(viewsets.ModelViewSet):
    serializer_class = MoodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return moods for the current user, newest first
        return Mood.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Automatically associate the mood with the logged-in user
        serializer.save(user=self.request.user)

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        mood_instance = serializer.validated_data.get('mood')
        conversation = serializer.save(user=self.request.user)
        mood_type = mood_instance.mood_type if mood_instance else 'neutral'

        initial_message_content = self.get_initial_message(mood_type)
        Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=initial_message_content
        )

    def get_initial_message(self, mood_type):
        messages = {
            'Happy': "That's wonderful to hear! I'm so glad you're feeling happy today. What's bringing you this joy? 😊",
            'Sad': "I'm here for you. It's completely okay to feel sad sometimes. Would you like to talk about what's on your mind? 💙",
            'Angry': "I understand you're feeling angry. Let's try to work through this together. What's happening that's causing this feeling? 😠",
            'Depressed': "I'm really sorry you're going through this. Please know you're not alone. I'm here to listen without judgment whenever you're ready to share. 😔",
            'Frustrated': "Frustration can be so tough to deal with. I'm here to help you navigate it. What's causing you to feel this way? 😤",
            'Disappointed': "I hear you. Disappointment is a heavy feeling. Let's talk about it. What happened that didn't go as planned? 😞",
        }
        return messages.get(mood_type, "Hello! I'm Aura, your personal companion. How can I support you today?")

    def get_system_prompt(self, mood_type):
        base = "You are an empathetic AI companion for students named 'Aura'. Your goal is to provide emotional support, validation, and gentle guidance. Your personality is warm, patient, and encouraging. Keep your responses concise and easy to understand. Use emojis where appropriate to convey warmth. Never give medical advice or diagnoses. Always prioritize listening and validating the user's feelings."
        prompts = {
            'Happy': f"{base} The student is feeling happy. Celebrate their positive emotions, be enthusiastic with them, and encourage them to savor the moment.",
            'Sad': f"{base} The student is sad. Be very gentle and compassionate. Offer a listening ear and validate their feelings. Avoid toxic positivity.",
            'Angry': f"{base} The student is angry. Help them process their frustration in a calm, non-judgmental way. Help them identify the source without being confrontational.",
            'Depressed': f"{base} The student is depressed. Be extremely supportive, patient, and gentle. Remind them they are not alone and that their feelings are valid. Offer simple, low-energy encouragement.",
            'Frustrated': f"{base} The student is frustrated. Help them break down challenges into smaller steps and offer encouragement. Validate the difficulty of their situation.",
            'Disappointed': f"{base} The student is disappointed. Acknowledge their setback and help them process it with kindness and self-compassion.",
        }
        return prompts.get(mood_type, base)

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def manage_messages(self, request, pk=None):
        conversation = self.get_object()

        if request.method == 'POST':
            user_content = request.data.get('content')
            if not user_content:
                return Response({'detail': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

            # Save the user's new message first
            Message.objects.create(conversation=conversation, role='user', content=user_content)

            # Prepare the full history *before* the new message for the chat session
            history = []
            # We fetch all messages EXCEPT the one we just added
            message_queryset = conversation.messages.order_by('created_at').exclude(content=user_content, role='user')
            for msg in message_queryset:
                role = 'model' if msg.role == 'assistant' else 'user'
                history.append({'role': role, 'parts': [msg.content]})
            
            ai_response_content = ""
            try:
                # --- START OF FIX ---
                mood_type = conversation.mood.mood_type if conversation.mood else 'neutral'
                system_prompt = self.get_system_prompt(mood_type)
                
                # 1. Initialize the model WITH the system instruction, as per your reference.
                model = genai.GenerativeModel(
                    'models/gemini-2.5-pro',
                    system_instruction=system_prompt
                )
                
                # 2. Start a stateful chat session using the existing history from the DB.
                chat = model.start_chat(history=history)
                
                # 3. Send ONLY the new user message to the ongoing chat session.
                response = chat.send_message(user_content)
                ai_response_content = response.text
                # --- END OF FIX ---

            except Exception as e:
                logger.error(f"GEMINI API CALL FAILED for conversation {pk}: {e}")
                ai_response_content = "I'm sorry, I'm having a little trouble connecting right now. Please give me a moment and try again."

            # Save the AI's response to the database
            Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=ai_response_content
            )

        # For both GET and POST, return the complete and ordered message history
        all_messages = conversation.messages.order_by('created_at')
        serializer = MessageSerializer(all_messages, many=True)
        return Response(serializer.data)
    
class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Habit.objects.filter(user=self.request.user)
            .prefetch_related('completions')
            .order_by('created_at')
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='toggle_completion')
    def toggle_completion(self, request, pk=None):
        habit = self.get_object()
        date = request.data.get('date')

        if not date:
            return Response(
                {'detail': 'A valid date is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        completion, created = HabitCompletion.objects.get_or_create(
            habit=habit, completed_date=date
        )

        if not created:
            completion.delete()
            # 🔁 Refresh from DB so serializer gets the latest completions
            habit.refresh_from_db()
            serializer = self.get_serializer(habit)
            return Response(
                {'status': 'completion removed', 'data': serializer.data},
                status=status.HTTP_200_OK,
            )

        # 🔁 Refresh from DB after new completion
        habit.refresh_from_db()
        serializer = self.get_serializer(habit)
        return Response(
            {'status': 'completion added', 'data': serializer.data},
            status=status.HTTP_201_CREATED,
        )


class JournalEntryViewSet(viewsets.ModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)