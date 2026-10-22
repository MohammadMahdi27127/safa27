from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User, Ring, Workgroup, WorkgroupMeeting,
    Resolution, AnnouncementAndNotification,
    WorkgroupFeedback, PersonalGrowthRecord,
    GrowthCustomItem, PublicArchive
)


from django.contrib.auth import authenticate

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # تعریف ورودی کد گروهی و پسورد
        self.fields['group_code'] = serializers.CharField()
        self.fields['password'] = serializers.CharField(write_only=True)
        if 'username' in self.fields:
            del self.fields['username']

    def validate(self, attrs):
        group_code = attrs.get('group_code')
        password = attrs.get('password')

        if not group_code or not password:
            raise serializers.ValidationError('کد گروهی و رمز عبور الزامی است.')

        # بررسی احراز هویت کاربر
        user = authenticate(group_code=group_code, password=password)
        if not user:
            raise serializers.ValidationError('کد گروهی یا رمز عبور اشتباه است.')

        if not user.is_active:
            raise serializers.ValidationError('حساب کاربری غیرفعال است.')

        refresh = self.get_token(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'group_code': user.group_code,
                'full_name': user.full_name,
                'is_manager': user.is_manager,
                'is_resolution_officer': user.is_resolution_officer,
                'is_workgroup_leader': user.is_workgroup_leader,
            }
        }


class UserRingMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'avatar']


class PublicArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicArchive
        fields = ['id', 'title', 'category', 'zip_file', 'created_at']


class PersonalGrowthRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalGrowthRecord
        fields = '__all__'
        read_only_fields = ['user', 'shamsi_date', 'created_at']


class GrowthCustomItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrowthCustomItem
        fields = '__all__'
        read_only_fields = ['user']


class WorkgroupMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkgroupMeeting
        fields = '__all__'


class ResolutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resolution
        fields = '__all__'


class WorkgroupFeedbackSerializer(serializers.ModelSerializer):
    subject = serializers.CharField(write_only=True, required=False, allow_blank=True)
    message = serializers.CharField(write_only=True, required=False, allow_blank=True)
    content = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = WorkgroupFeedback
        fields = ['id', 'workgroup', 'user', 'content', 'created_at', 'subject', 'message']
        read_only_fields = ['user', 'created_at']

    def validate(self, attrs):
        subject = attrs.pop('subject', '').strip()
        message = attrs.pop('message', '').strip()
        content = attrs.get('content', '').strip()

        # اگر موضوع و پیام ارسال شده بود، ترکیب کن
        if subject or message:
            attrs['content'] = f"[{subject}] {message}" if subject else message
        elif not content:
            raise serializers.ValidationError({'content': 'متن پیشنهاد نمی‌تواند خالی باشد.'})

        return attrs


class AnnouncementAndNotificationSerializer(serializers.ModelSerializer):
    workgroup_name = serializers.CharField(source='workgroup.name', read_only=True)

    class Meta:
        model = AnnouncementAndNotification
        fields = '__all__'