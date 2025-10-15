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
