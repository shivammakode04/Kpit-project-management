from django.contrib import admin
from .models import Team, TeamInvitation


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'member_count', 'created_at']
    search_fields = ['name', 'owner__username']
    filter_horizontal = ['members']
    
    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'


@admin.register(TeamInvitation)
class TeamInvitationAdmin(admin.ModelAdmin):
    list_display = ['team', 'inviter', 'invitee', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['team__name', 'inviter__username', 'invitee__username']
