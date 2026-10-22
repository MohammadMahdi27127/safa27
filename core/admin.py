from django.contrib import admin
from .models import (
    User, Ring, Workgroup, WorkgroupMeeting,
    Resolution, AnnouncementAndNotification,
    WorkgroupFeedback, PersonalGrowthRecord,
    GrowthCustomItem, PublicArchive
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('group_code', 'full_name', 'ring', 'workgroup', 'is_manager', 'is_resolution_officer')
    search_fields = ('group_code', 'full_name')
    list_filter = ('is_manager', 'is_resolution_officer', 'ring', 'workgroup')

@admin.register(Ring)
class RingAdmin(admin.ModelAdmin):
    list_display = ('ring_number', 'name', 'score')
    search_fields = ('name',)

@admin.register(Workgroup)
class WorkgroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'leader', 'score')
    search_fields = ('name',)

@admin.register(Resolution)
class ResolutionAdmin(admin.ModelAdmin):
    list_display = ('title', 'workgroup', 'is_completed', 'created_at')
    list_filter = ('is_completed', 'workgroup')

admin.site.register(WorkgroupMeeting)
admin.site.register(AnnouncementAndNotification)
admin.site.register(WorkgroupFeedback)
admin.site.register(PersonalGrowthRecord)
admin.site.register(GrowthCustomItem)
admin.site.register(PublicArchive)