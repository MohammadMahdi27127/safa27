from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomLoginView, DashboardView, ProfileView, SliderImagesView,
    UserAvatarUpdateView, ChangePasswordView,
    PublicArchiveView, PersonalGrowthView, GrowthCustomItemCreateView,
    WorkgroupDetailView, ToggleResolutionView, CreateMeetingView,
    WorkgroupFeedbackCreateView, ResolutionOfficerDashboardView,
    ManagerDashboardView,ManagerSendMessageView
)

urlpatterns = [
    path('auth/login/', CustomLoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/avatar/', UserAvatarUpdateView.as_view(), name='profile-avatar'),
    path('profile/change-password/', ChangePasswordView.as_view(), name='change-password'),

    path('archive/', PublicArchiveView.as_view(), name='public-archive'),
    path('growth/', PersonalGrowthView.as_view(), name='personal-growth'),
    path('growth/custom-item/', GrowthCustomItemCreateView.as_view(), name='growth-custom-item'),

    path('workgroup/', WorkgroupDetailView.as_view(), name='workgroup-detail'),
    path('workgroup/resolution/<int:pk>/toggle/', ToggleResolutionView.as_view(), name='toggle-resolution'),
    path('workgroup/meeting/', CreateMeetingView.as_view(), name='create-meeting'),
    path('workgroup/feedback/', WorkgroupFeedbackCreateView.as_view(), name='workgroup-feedback'),

    path('resolution-officer/', ResolutionOfficerDashboardView.as_view(), name='resolution-officer'),
    path('manager/', ManagerDashboardView.as_view(), name='manager-dashboard'),

    path('slider-images/', SliderImagesView.as_view(), name='slider-images'),
path('manager/send-message/', ManagerSendMessageView.as_view(), name='manager-send-message'),
]