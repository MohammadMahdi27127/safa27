from datetime import timedelta
from django.utils import timezone
from rest_framework import views, status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
import jdatetime
import os
from django.conf import settings
from rest_framework import views, status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Workgroup, Resolution, AnnouncementAndNotification, User, Ring, WorkgroupMeeting, WorkgroupFeedback, PersonalGrowthRecord, GrowthCustomItem
from .services import get_user_sheet_info

from .models import (
    User, Ring, Workgroup, WorkgroupMeeting,
    Resolution, AnnouncementAndNotification,
    WorkgroupFeedback, PersonalGrowthRecord,
    GrowthCustomItem, PublicArchive,
    CustomForm, CustomFormResponse
)
from .serializers import (
    PublicArchiveSerializer, PersonalGrowthRecordSerializer,
    GrowthCustomItemSerializer, WorkgroupMeetingSerializer,
    ResolutionSerializer, WorkgroupFeedbackSerializer,
    AnnouncementAndNotificationSerializer,
    CustomFormSerializer, CustomFormResponseSerializer
)
from .services import get_user_sheet_info
from django.db.models import Q

IMAGE_EXTENSIONS = ('.png', '.jpg', '.jpeg', '.webp', '.gif')


def absolute_media(request, file_field):
    if not file_field:
        return None
    try:
        return request.build_absolute_uri(file_field.url)
    except ValueError:
        return None


def collect_media_images(request):
    """عکس‌های اسلایدر از ریشه media و زیرپوشه slider؛ آواتار و آرشیو جدا می‌مانند."""
    images = []
    seen = set()
    roots = [settings.MEDIA_ROOT, os.path.join(settings.MEDIA_ROOT, 'slider')]
    for root in roots:
        if not os.path.isdir(root):
            continue
        for fname in sorted(os.listdir(root)):
            path = os.path.join(root, fname)
            if not os.path.isfile(path) or not fname.lower().endswith(IMAGE_EXTENSIONS):
                continue
            rel = os.path.relpath(path, settings.MEDIA_ROOT).replace('\\', '/')
            if rel in seen:
                continue
            seen.add(rel)
            images.append(request.build_absolute_uri(settings.MEDIA_URL + rel))
    return images


class CustomLoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        group_code = request.data.get('group_code', '').strip()
        password = request.data.get('password', '')

        if not group_code or not password:
            return Response({'error': 'کد گروهی و رمز عبور الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(group_code=group_code)
        except User.DoesNotExist:
            return Response({'error': 'کاربر یافت نشد.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'رمز عبور اشتباه است.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'حساب کاربری غیرفعال است.'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)

        return Response({
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
        }, status=status.HTTP_200_OK)


class DashboardView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_sheet = get_user_sheet_info(user.group_code)

        # دریافت اعضای حلقه به همراه وضعیت حضور
        ring_members_data = []
        if user.ring:
            for m in User.objects.filter(ring=user.ring):
                sheet_m = get_user_sheet_info(m.group_code)
                ring_members_data.append({
                    'id': m.id,
                    'full_name': m.full_name,
                    'group_code': m.group_code,
                    'avatar': absolute_media(request, m.avatar),
                    'attendance_rate': sheet_m.get('attendance_rate') or 'یافت نشد'
                })

        # فقط پیام‌هایی که واقعاً مخاطب‌شان همین کاربر، حلقه یا کارگروه اوست
        notif_query = Q(msg_type='manager_broadcast', target_user=user) | Q(
            msg_type='manager_broadcast',
            target_user__isnull=True,
            ring__isnull=True,
            workgroup__isnull=True,
        )
        if user.ring_id:
            notif_query |= Q(
                msg_type='manager_broadcast',
                target_user__isnull=True,
                ring_id=user.ring_id,
                workgroup__isnull=True,
            )
        if user.workgroup_id:
            notif_query |= Q(
                msg_type='manager_broadcast',
                target_user__isnull=True,
                workgroup_id=user.workgroup_id,
                ring__isnull=True,
            )
        week_ago = timezone.now() - timedelta(days=7)
        user_notifs = AnnouncementAndNotification.objects.filter(
            notif_query,
            created_at__gte=week_ago,
        ).order_by('-created_at')

        return Response({
            'full_name': user.full_name,
            'group_code': user.group_code,
            'avatar': absolute_media(request, user.avatar),
            'attendance_rate': user_sheet.get('attendance_rate'),
            'user_found': user_sheet.get('found', False),
            'is_manager': user.is_manager,
            'is_resolution_officer': user.is_resolution_officer,
            'is_workgroup_leader': user.is_workgroup_leader,
            'ring_name': user.ring.name if user.ring else None,
            'ring_members': ring_members_data,
            'manager_messages': [n.text for n in user_notifs],  # پیام‌های فعال مربی برای نمایش در داشبورد
        })


class ProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        sheet_info = get_user_sheet_info(user.group_code)

        return Response({
            'full_name': user.full_name,
            'group_code': user.group_code,
            'ring_name': user.ring.name if user.ring else None,
            'avatar': absolute_media(request, user.avatar),
            'is_manager': user.is_manager,
            'is_resolution_officer': user.is_resolution_officer,
            'is_workgroup_leader': user.is_workgroup_leader,
            'attendance_rate': sheet_info.get('attendance_rate'),
            'user_found': sheet_info.get('found', False),
            'recent_programs': sheet_info.get('last_10_columns', []),
        })


class UserAvatarUpdateView(views.APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request):
        avatar_file = request.FILES.get('avatar')
        if not avatar_file:
            return Response({'error': 'فایلی انتخاب نشده است.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.avatar = avatar_file
        request.user.save()
        return Response({'avatar': absolute_media(request, request.user.avatar)}, status=status.HTTP_200_OK)


class ChangePasswordView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')

        if not current_password or not new_password:
            return Response({'error': 'تمام فیلدها الزامی هستند.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({'error': 'رمز عبور فعلی نادرست است.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 4:
            return Response({'error': 'رمز عبور باید حداقل ۴ کاراکتر باشد.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'رمز عبور با موفقیت تغییر کرد.'}, status=status.HTTP_200_OK)


class PersonalGrowthView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now_shamsi = jdatetime.date.today().strftime('%Y/%m/%d')
        custom_items = GrowthCustomItem.objects.filter(user=request.user).values('id', 'item_type', 'title')
        return Response({
            'today_shamsi': now_shamsi,
            'custom_items': list(custom_items)
        })

    def post(self, request):
        now_shamsi = jdatetime.date.today().strftime('%Y/%m/%d')
        serializer = PersonalGrowthRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, shamsi_date=now_shamsi)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GrowthCustomItemCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = GrowthCustomItemSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkgroupDetailView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # تشخیص منعطف کارگروه
        workgroup = None
        if hasattr(user, 'led_workgroup') and user.led_workgroup:
            workgroup = user.led_workgroup
        elif user.workgroup:
            workgroup = user.workgroup
        elif user.is_manager:
            workgroup = Workgroup.objects.first()

        if not workgroup:
            return Response({'error': 'هیچ کارگروهی در سیستم یافت نشد یا به شما متصل نیست.'}, status=status.HTTP_404_NOT_FOUND)

        week_ago = timezone.now() - timedelta(days=7)
        announcements = AnnouncementAndNotification.objects.filter(
            workgroup=workgroup,
            created_at__gte=week_ago,
        ).values('id', 'text', 'created_at')

        resolutions = Resolution.objects.filter(workgroup=workgroup).values(
            'id', 'title', 'is_completed'
        )

        members = User.objects.filter(workgroup=workgroup).values('id', 'full_name', 'group_code')

        return Response({
            'workgroup_id': workgroup.id,
            'workgroup_name': workgroup.name,
            'score': workgroup.score,
            'today_shamsi': jdatetime.date.today().strftime('%Y/%m/%d'),
            'announcements': list(announcements),
            'resolutions': list(resolutions),
            'members': list(members),
            'members_count': members.count(),
        }, status=status.HTTP_200_OK)


class ToggleResolutionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            res = Resolution.objects.get(pk=pk)
            res.is_completed = not res.is_completed
            res.completed_at = timezone.now() if res.is_completed else None
            res.save()

            if res.is_completed:
                AnnouncementAndNotification.objects.create(
                    msg_type='completion_alert',
                    workgroup=res.workgroup,
                    resolution=res,
                    text=f"کارگروه «{res.workgroup.name}» مصوبه «{res.title}» را انجام داد."
                )

            return Response({'status': 'ok', 'is_completed': res.is_completed})
        except Resolution.DoesNotExist:
            return Response({'error': 'مصوبه پیدا نشد'}, status=status.HTTP_404_NOT_FOUND)

class SliderImagesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'images': collect_media_images(request)})

class ManagerSendMessageView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_manager:
            return Response({'error': 'دسترسی غیرمجاز.'}, status=status.HTTP_403_FORBIDDEN)

        target_type = request.data.get('target_type')  # 'all', 'workgroup', 'ring', 'user'
        target_id = request.data.get('target_id')
        message_text = request.data.get('text', '').strip()

        if not message_text:
            return Response({'error': 'متن پیام الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if target_type == 'all':
                AnnouncementAndNotification.objects.create(
                    msg_type='manager_broadcast',
                    text=f"📢 پیام مربی: {message_text}"
                )
            elif target_type == 'workgroup':
                wg = Workgroup.objects.get(id=target_id)
                AnnouncementAndNotification.objects.create(
                    msg_type='manager_broadcast',
                    workgroup=wg,
                    text=f"📢 پیام مربی به کارگروه {wg.name}: {message_text}"
                )
            elif target_type == 'ring':
                rg = Ring.objects.get(id=target_id)
                AnnouncementAndNotification.objects.create(
                    msg_type='manager_broadcast',
                    ring=rg,
                    text=f"📢 پیام مربی به حلقه {rg.name}: {message_text}"
                )
            elif target_type == 'user':
                u = User.objects.get(id=target_id)
                AnnouncementAndNotification.objects.create(
                    msg_type='manager_broadcast',
                    target_user=u,
                    text=f"📢 پیام مربی به {u.full_name}: {message_text}"
                )
            else:
                return Response({'error': 'مخاطب پیام نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)
        except (Workgroup.DoesNotExist, Ring.DoesNotExist, User.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'مخاطب پیدا نشد.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'status': 'پیام با موفقیت ارسال و در داشبورد ثبت شد.'}, status=status.HTTP_201_CREATED)


class CreateMeetingView(views.APIView):
    """ثبت جلسه جدید کارگروه توسط مسئول کارگروه"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        workgroup_id = request.data.get('workgroup')
        meeting_date = request.data.get('meeting_shamsi_date', '').strip()
        attendees = request.data.get('attendees_text', '').strip()
        descriptions = request.data.get('descriptions_and_titles', '').strip()

        # اگر تاریخ فرستاده نشده بود، تاریخ امروز شمسی را خودکار ست کن
        if not meeting_date:
            meeting_date = jdatetime.date.today().strftime('%Y/%m/%d')

        if not descriptions:
            return Response(
                {'error': 'عناوین و شرح مباحث جلسه الزامی است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not workgroup_id:
            # اگر آی‌دی کارگروه ارسال نشده بود، از کارگروه خود کاربر بردار
            if hasattr(request.user, 'led_workgroup') and request.user.led_workgroup:
                wg = request.user.led_workgroup
            elif request.user.workgroup:
                wg = request.user.workgroup
            else:
                return Response(
                    {'error': 'کارگروه مشخص نشده است.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            try:
                wg = Workgroup.objects.get(id=workgroup_id)
            except (Workgroup.DoesNotExist, ValueError):
                return Response(
                    {'error': 'کارگروه مورد نظر یافت نشد.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # ساخت مستقیم و امن جلسه در دیتابیس
        meeting = WorkgroupMeeting.objects.create(
            workgroup=wg,
            meeting_shamsi_date=meeting_date,
            attendees_text=attendees if attendees else 'ثبت نشده',
            descriptions_and_titles=descriptions
        )

        return Response({
            'status': 'ok',
            'message': 'جلسه با موفقیت ثبت شد.',
            'id': meeting.id
        }, status=status.HTTP_201_CREATED)


class WorkgroupFeedbackCreateView(views.APIView):
    """ارسال بازخورد و پیشنهاد توسط مسئول کارگروه به همراه اعتبارسنجی کامل"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        workgroup_id = request.data.get('workgroup')
        subject = str(request.data.get('subject', '')).strip()
        message = str(request.data.get('message', '')).strip()
        raw_content = str(request.data.get('content', '')).strip()

        # استخراج و ترکیب متن نظر/پیشنهاد بر اساس فیلدهای ارسالی فرانت‌اند
        if subject and message:
            content = f"[{subject}] {message}"
        elif message:
            content = message
        elif raw_content:
            content = raw_content
        else:
            return Response(
                {'error': 'متن یا موضوع پیشنهاد نمی‌تواند خالی باشد.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # اعتبارسنجی وجود کارگروه
        if not workgroup_id:
            return Response(
                {'error': 'شناسه کارگروه الزامی است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            wg = Workgroup.objects.get(id=workgroup_id)
        except (Workgroup.DoesNotExist, ValueError):
            return Response(
                {'error': 'کارگروه مورد نظر در سیستم یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # ثبت پیشنهاد در دیتابیس با انتساب کاربر لاگین‌شده
        feedback = WorkgroupFeedback.objects.create(
            workgroup=wg,
            user=request.user,
            content=content
        )

        return Response({
            'status': 'ok',
            'message': 'نظر و پیشنهاد با موفقیت ثبت شد.',
            'id': feedback.id
        }, status=status.HTTP_201_CREATED)


class PublicArchiveView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicArchiveSerializer

    def get_queryset(self):
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        qs = PublicArchive.objects.all()
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs


class ResolutionOfficerDashboardView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_resolution_officer and not request.user.is_manager:
            return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_403_FORBIDDEN)

        workgroups = Workgroup.objects.all().values('id', 'name')
        week_ago = timezone.now() - timedelta(days=7)
        notifications = AnnouncementAndNotification.objects.filter(
            msg_type='completion_alert',
            created_at__gte=week_ago,
        ).order_by('-created_at')

        return Response({
            'workgroups': list(workgroups),
            'notifications': AnnouncementAndNotificationSerializer(notifications, many=True).data
        })

    def post(self, request):
        if not request.user.is_resolution_officer and not request.user.is_manager:
            return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_403_FORBIDDEN)

        title = str(request.data.get('title', '')).strip()
        if not title:
            return Response({'error': 'عنوان مصوبه الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        if str(request.data.get('workgroup')) == 'all':
            created = [
                Resolution.objects.create(workgroup=wg, title=title)
                for wg in Workgroup.objects.all()
            ]
            if not created:
                return Response({'error': 'کارگروهی برای ابلاغ وجود ندارد.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'status': 'ok', 'count': len(created)}, status=status.HTTP_201_CREATED)

        serializer = ResolutionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManagerDashboardView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_manager:
            return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_403_FORBIDDEN)

        section = request.query_params.get('section', 'workgroups')
        now = timezone.now()

        if section == 'workgroups':
            workgroups_data = []
            for wg in Workgroup.objects.all():
                m_7_days = wg.meetings.filter(created_at__gte=now - timedelta(days=7)).count()
                m_30_days = wg.meetings.filter(created_at__gte=now - timedelta(days=30)).count()
                members = list(User.objects.filter(workgroup=wg).values('id', 'full_name', 'group_code'))
                resolutions_done = list(wg.resolutions.filter(is_completed=True).values('id', 'title'))
                meetings = list(wg.meetings.values('id', 'meeting_shamsi_date', 'attendees_text', 'descriptions_and_titles'))
                feedbacks = [
                    {
                        'id': fb.id,
                        'content': fb.content,
                        'author': fb.user.full_name if fb.user_id else 'نامشخص',
                        'created_at': timezone.localtime(fb.created_at).strftime('%Y/%m/%d %H:%M'),
                    }
                    for fb in wg.feedbacks.select_related('user').all()
                ]

                workgroups_data.append({
                    'id': wg.id,
                    'name': wg.name,
                    'score': wg.score,
                    'meetings_7_days': m_7_days,
                    'meetings_30_days': m_30_days,
                    'members': members,
                    'completed_resolutions': resolutions_done,
                    'meetings': meetings,
                    'feedbacks': feedbacks,
                })
            return Response({'workgroups': workgroups_data})

        elif section == 'growth':
            users_data = []
            for u in User.objects.filter(is_manager=False).order_by('full_name'):
                sheet_info = get_user_sheet_info(u.group_code)
                records = PersonalGrowthRecord.objects.filter(
                    user=u,
                    created_at__gte=now - timedelta(days=7)
                ).values('shamsi_date', 'exercise_hours', 'reading_pages', 'daily_responsibility', 'skill_learning', 'leisure_time')

                last_item = GrowthCustomItem.objects.filter(user=u).order_by('-created_at').first()

                users_data.append({
                    'id': u.id,
                    'full_name': u.full_name,
                    'group_code': u.group_code,
                    'attendance_rate': sheet_info.get('attendance_rate') or 'یافت نشد',
                    'last_custom_item': last_item.title if last_item else 'موردی ثبت نشده',
                    'records_7_days': list(records),
                })
            return Response({'growth_users': users_data})

        elif section == 'rings':
            rings_data = []
            for r in Ring.objects.all():
                members_list = []
                for m in User.objects.filter(ring=r):
                    sheet_info = get_user_sheet_info(m.group_code)
                    members_list.append({
                        'id': m.id,
                        'full_name': m.full_name,
                        'group_code': m.group_code,
                        'attendance_rate': sheet_info.get('attendance_rate') or 'یافت نشد'
                    })
                rings_data.append({
                    'id': r.id,
                    'name': r.name,
                    'ring_number': r.ring_number,
                    'score': r.score,
                    'members': members_list,
                })
            return Response({'rings': rings_data})

        return Response({'error': 'بخش نامعتبر'}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        if not request.user.is_manager:
            return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_403_FORBIDDEN)

        target = request.data.get('target')
        target_id = request.data.get('id')
        score = request.data.get('score')

        if not (1 <= int(score) <= 10):
            return Response({'error': 'امتیاز باید بین ۱ تا ۱۰ باشد'}, status=status.HTTP_400_BAD_REQUEST)

        if target == 'workgroup':
            wg = Workgroup.objects.get(id=target_id)
            wg.score = int(score)
            wg.save()
            return Response({'status': 'امتیاز کارگروه ذخیره شد'})
        elif target == 'ring':
            rg = Ring.objects.get(id=target_id)
            rg.score = int(score)
            rg.save()
            return Response({'status': 'امتیاز حلقه ذخیره شد'})

        return Response({'error': 'هدف نامعتبر'}, status=status.HTTP_400_BAD_REQUEST)



class CustomFormCreateView(generics.CreateAPIView):
    """سازنده فرم‌های سفارشی - برای مسئولین کارگروه"""
    permission_classes = [IsAuthenticated]
    serializer_class = CustomFormSerializer

    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # تأیید اینکه کاربر مسئول کارگروه است
            if not self.request.user.is_workgroup_leader:
                raise PermissionError('فقط مسئول کارگروه می‌تواند فرم سفارشی ایجاد کند.')
            
            # ✅ workgroup را از درخواست یا از کاربر استخراج کن (هر دو اختیاری)
            workgroup = None
            workgroup_id = self.request.data.get('workgroup_id')
            
            if workgroup_id:
                try:
                    workgroup = Workgroup.objects.get(id=workgroup_id)
                    # تأیید اینکه کاربر مسئول این کارگروه است
                    if self.request.user.led_workgroup != workgroup:
                        raise PermissionError('شما مسئول این کارگروه نیستید.')
                except Workgroup.DoesNotExist:
                    logger.warning(f'Workgroup not found: {workgroup_id}')
                    # اگر workgroup پیدا نشد، اما برای خود مسئول تلاش کن
                    if hasattr(self.request.user, 'led_workgroup'):
                        workgroup = self.request.user.led_workgroup
            else:
                # اگر workgroup_id ارسال نشد، از کارگروه مسئول استفاده کن
                if hasattr(self.request.user, 'led_workgroup'):
                    workgroup = self.request.user.led_workgroup
            
            # workgroup می‌تواند None باشد (فرم همگانی)
            logger.info(f'Creating custom form with workgroup: {workgroup}')
            serializer.save(creator=self.request.user, workgroup=workgroup)
            
        except PermissionError as e:
            logger.error(f'Permission error creating form: {str(e)}')
            raise PermissionError(str(e))
        except Exception as e:
            logger.error(f'Error creating form: {str(e)}', exc_info=True)
            raise

    def post(self, request, *args, **kwargs):
        """✅ اضافه کردن exception handling صریح"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            return super().post(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Form creation error: {str(e)}', exc_info=True)
            print(f'[ERROR] Form creation failed: {str(e)}')
            import traceback
            traceback.print_exc()
            
            return Response(
                {'error': str(e), 'details': 'لطفاً اطلاعات فرم را بررسی کنید.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class CustomFormListView(generics.ListAPIView):
    """لیست‌کردن فرم‌های سفارشی برای مسئول کارگروه"""
    permission_classes = [IsAuthenticated]
    serializer_class = CustomFormSerializer

    def get_queryset(self):
        # مسئول کارگروه می‌تواند فقط فرم‌های کارگروه خود را ببیند
        if self.request.user.is_workgroup_leader and hasattr(self.request.user, 'led_workgroup'):
            return CustomForm.objects.filter(workgroup=self.request.user.led_workgroup)
        return CustomForm.objects.none()


class CustomFormDetailView(generics.RetrieveUpdateDestroyAPIView):
    """جزئیات و ویرایش فرم سفارشی"""
    permission_classes = [IsAuthenticated]
    serializer_class = CustomFormSerializer
    queryset = CustomForm.objects.all()

    def get_object(self):
        obj = super().get_object()
        # تأیید اینکه صرفاً سازنده می‌تواند فرم را ویرایش/حذف کند
        if obj.creator != self.request.user:
            raise PermissionError('فقط سازنده فرم می‌تواند آن را ویرایش کند.')
        return obj


class ActiveCustomFormsView(views.APIView):
    """دریافت فرم‌های فعال - برای همه کاربران (global)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # ✅ حذف filter workgroup - فرم‌ها برای همه کاربران در دسترس هستند
            now = timezone.now()
            active_forms = CustomForm.objects.filter(
                is_active=True
            ).filter(
                # expiration_date یا None است یا بزرگ‌تر از الان
                models.Q(expiration_date__isnull=True) | models.Q(expiration_date__gt=now)
            ).prefetch_related('responses').order_by('-created_at')
            
            logger.info(f'User {request.user.id} fetching active forms. Found {active_forms.count()} forms.')
            
            # ✅ اضافه کردن تعداد پاسخ‌ها و وضعیت پاسخ کاربر
            form_list = []
            for form in active_forms:
                form_data = {
                    'id': form.id,
                    'title': form.title,
                    'description': form.description,
                    'fields_schema': form.fields_schema,
                    'expiration_date': form.expiration_date,
                    'response_count': form.responses.count(),
                    'user_submitted': form.responses.filter(user=request.user).exists(),
                    'is_global': form.workgroup is None,  # ✅ نشان بده که آیا فرم همگانی است
                    'workgroup_name': form.workgroup.name if form.workgroup else 'همگانی'
                }
                form_list.append(form_data)
            
            return Response(form_list, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f'Error fetching active forms: {str(e)}', exc_info=True)
            return Response(
                {'error': f'خطا در دریافت فرم‌های فعال: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CustomFormResponseCreateView(views.APIView):
    """ارسال پاسخ به فرم سفارشی"""
    permission_classes = [IsAuthenticated]

    def post(self, request, form_id):
        try:
            form = CustomForm.objects.get(id=form_id)
        except CustomForm.DoesNotExist:
            return Response(
                {'error': 'فرم پیدا نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # تأیید اینکه فرم هنوز فعال است
        if form.is_expired():
            return Response(
                {'error': 'این فرم منقضی شده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # تأیید اینکه کاربر عضو کارگروه فرم است
        if request.user.workgroup != form.workgroup:
            return Response(
                {'error': 'این فرم برای کارگروه شما نیست.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # دریافت یا آپدیت پاسخ موجود
        response_obj, created = CustomFormResponse.objects.update_or_create(
            form=form,
            user=request.user,
            defaults={'answers': request.data.get('answers', {})}
        )
        
        serializer = CustomFormResponseSerializer(response_obj)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)


class CustomFormResponsesListView(generics.ListAPIView):
    """لیست‌کردن پاسخ‌های فرم برای مسئول کارگروه"""
    permission_classes = [IsAuthenticated]
    serializer_class = CustomFormResponseSerializer

    def get_queryset(self):
        form_id = self.kwargs.get('form_id')
        try:
            form = CustomForm.objects.get(id=form_id)
        except CustomForm.DoesNotExist:
            return CustomFormResponse.objects.none()
        
        # تأیید اینکه کاربر سازنده فرم است
        if form.creator != self.request.user:
            return CustomFormResponse.objects.none()
        
        return CustomFormResponse.objects.filter(form=form)


class CustomFormExportExcelView(views.APIView):
    """صادرات پاسخ‌های فرم به فایل Excel - با فیلتر بازه زمانی"""
    permission_classes = [IsAuthenticated]

    def get(self, request, form_id):
        from django.http import HttpResponse
        from django.utils import timezone
        from datetime import timedelta
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            form = CustomForm.objects.get(id=form_id)
        except CustomForm.DoesNotExist:
            logger.warning(f'Form not found: {form_id}')
            return Response(
                {'error': 'فرم پیدا نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # تأیید اینکه کاربر سازنده فرم است
        if form.creator != request.user:
            logger.warning(f'Unauthorized export attempt: user {request.user.id} for form {form_id}')
            return Response(
                {'error': 'دسترسی غیرمجاز.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # ✅ دریافت بازه زمانی از query params
        days_back = request.query_params.get('days', 7)  # پیش‌فرض: ۷ روز
        try:
            days_back = int(days_back)
            if days_back < 1 or days_back > 365:
                days_back = 7
        except (ValueError, TypeError):
            days_back = 7
        
        # محاسبه تاریخ شروع
        now = timezone.now()
        start_date = now - timedelta(days=days_back)
        
        # ✅ فیلتر پاسخ‌ها بر اساس بازه زمانی
        responses = CustomFormResponse.objects.filter(
            form=form,
            submitted_at__gte=start_date
        ).order_by('-submitted_at')
        
        if responses.count() == 0:
            logger.info(f'No responses found for form {form_id} in last {days_back} days')
            return Response(
                {'error': f'هیچ پاسخی برای این فرم در {days_back} روز اخیر ثبت نشده است.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # فراخوانی تابع صادرات
        try:
            from .export_utils import export_form_responses_to_excel_with_date_range
            file_content, filename = export_form_responses_to_excel_with_date_range(form, responses, days_back)
            
            # ✅ بازگشت HttpResponse مستقیم به جای Response
            response = HttpResponse(
                file_content,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            logger.info(f'Successfully exported responses for form {form_id}: {filename}')
            return response
        
        except Exception as e:
            logger.error(f'Error exporting form responses: {str(e)}', exc_info=True)
            print(f'[ERROR] export_form_responses_to_excel_with_date_range failed: {str(e)}')
            import traceback
            traceback.print_exc()
            
            return Response(
                {'error': f'خطا در صادرات: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class SkillsExportExcelView(views.APIView):
    """✅ صادرات آمار مهارت‌های تمام اعضا (همگانی) به فایل Excel - فقط برای مسئول آموزش (کد 27118)"""
    permission_classes = [IsAuthenticated]
    
    TRAINING_MANAGER_CODE = '27118'  # کد گروهی مسئول آموزش

    def get(self, request):
        from django.http import HttpResponse
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # دریافت پارامترهای query
            period = request.query_params.get('period', 'thursday')  # پیش‌فرض: دوره پنج‌شنبه
            reference_date_str = request.query_params.get('reference_date')  # اختیاری

            # ✅ بررسی دسترسی: فقط مسئول آموزش (کد 27118) می‌تواند دسترسی داشته باشد
            user = request.user
            if user.group_code != self.TRAINING_MANAGER_CODE:
                logger.warning(f'Unauthorized access attempt: user {user.id} with group_code {user.group_code}')
                return Response(
                    {'error': 'دسترسی غیرمجاز. این قابلیت فقط برای مسئول آموزش است.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # اعتبارسنجی پارامترها
            if period not in ['sunday', 'thursday']:
                logger.warning(f'Invalid period: {period}')
                return Response(
                    {'error': 'period باید "sunday" یا "thursday" باشد.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # تبدیل تاریخ مرجع
            reference_date = None
            if reference_date_str:
                try:
                    reference_date = datetime.strptime(reference_date_str, '%Y-%m-%d')
                except ValueError:
                    logger.warning(f'Invalid reference_date format: {reference_date_str}')
                    return Response(
                        {'error': 'فرمت reference_date باید YYYY-MM-DD باشد.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # ✅ فراخوانی تابع صادرات - workgroup=None (همه اعضا)
            logger.info(f'Exporting skills for ALL members, period {period}')
            try:
                from .export_utils import export_skills_to_excel_global
                file_content, filename = export_skills_to_excel_global(
                    period=period,
                    reference_date=reference_date
                )

                # ✅ بازگشت HttpResponse مستقیم به جای Response
                response = HttpResponse(
                    file_content,
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                logger.info(f'Successfully exported skills file for all members: {filename}')
                return response
                
            except Exception as e:
                # ✅ مفصل logging برای خطاهای صادرات
                logger.error(f'Error in export_skills_to_excel_global: {str(e)}', exc_info=True)
                print(f'[ERROR] export_skills_to_excel_global failed: {str(e)}')
                import traceback
                traceback.print_exc()
                
                return Response(
                    {'error': f'خطا در صادرات Excel: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            # ✅ ضیافت خطاهای غیرمنتظره
            logger.error(f'Unexpected error in SkillsExportExcelView: {str(e)}', exc_info=True)
            print(f'[ERROR] Unexpected error in SkillsExportExcelView: {str(e)}')
            import traceback
            traceback.print_exc()
            
            return Response(
                {'error': 'خطا غیرمنتظره در سرور'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
