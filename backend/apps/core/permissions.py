from rest_framework.permissions import BasePermission

from apps.projects.models import ProjectMember


class IsProjectMember(BasePermission):
    """Allow access to any project member (read access)."""

    def has_permission(self, request, view):
        project_id = view.kwargs.get('project_id') or view.kwargs.get('pk')
        if not project_id:
            return False
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
        ).exists()


class IsProjectEditor(BasePermission):
    """Allow write access to admin or editor members."""

    def has_permission(self, request, view):
        project_id = view.kwargs.get('project_id') or view.kwargs.get('pk')
        if not project_id:
            return False
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role__in=['admin', 'editor'],
        ).exists()


class IsProjectAdmin(BasePermission):
    """Allow full access only to project admin/owner."""

    def has_permission(self, request, view):
        project_id = view.kwargs.get('project_id') or view.kwargs.get('pk')
        if not project_id:
            return False
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role='admin',
        ).exists()


def get_user_project_role(user, project_id):
    """Return the role of a user in a project, or None."""
    membership = ProjectMember.objects.filter(
        project_id=project_id,
        user=user,
    ).first()
    return membership.role if membership else None
