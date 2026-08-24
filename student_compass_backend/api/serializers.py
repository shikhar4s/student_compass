from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
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
        fields = ['completed_date']

class HabitSerializer(serializers.ModelSerializer):
    completions = HabitCompletionSerializer(many=True, read_only=True)

    class Meta:
        model = Habit
        fields = ['id', 'title', 'description', 'color', 'target_days', 'completions']
        read_only_fields = ('user',)

class JournalEntrySerializer(serializers.ModelSerializer):
    lock_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        min_length=4,
        trim_whitespace=False,
    )
    is_unlocked = serializers.SerializerMethodField()

    class Meta:
        model = JournalEntry
        fields = [
            'id', 'title', 'content', 'sentiment', 'is_locked', 'is_unlocked',
            'lock_password', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_unlocked', 'created_at', 'updated_at']

    def get_is_unlocked(self, obj):
        return not obj.is_locked or not obj.lock_password_hash

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_locked and instance.lock_password_hash:
            data['content'] = ''
            data['sentiment'] = None
        return data

    def validate(self, attrs):
        password = attrs.get('lock_password', '')
        will_be_locked = attrs.get('is_locked', self.instance.is_locked if self.instance else False)

        if self.instance and self.instance.is_locked and self.instance.lock_password_hash:
            if not password or not check_password(password, self.instance.lock_password_hash):
                raise serializers.ValidationError({'lock_password': 'Enter the current journal password.'})
        elif self.instance and self.instance.is_locked and will_be_locked and not password:
            raise serializers.ValidationError({'lock_password': 'Create a password to protect this legacy private entry.'})
        elif will_be_locked and not password:
            raise serializers.ValidationError({'lock_password': 'Create a password for this private entry.'})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('lock_password', '')
        if validated_data.get('is_locked'):
            validated_data['lock_password_hash'] = make_password(password)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('lock_password', '')
        will_be_locked = validated_data.get('is_locked', instance.is_locked)
        if will_be_locked and not instance.lock_password_hash:
            validated_data['lock_password_hash'] = make_password(password)
        elif not will_be_locked:
            validated_data['lock_password_hash'] = ''
        return super().update(instance, validated_data)
