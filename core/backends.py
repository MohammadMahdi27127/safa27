from django.contrib.auth.backends import ModelBackend
from .models import User


class GroupCodeAuthBackend(ModelBackend):
    """Authenticate users by group_code while respecting Django's active-user policy."""

    def authenticate(self, request, group_code=None, password=None, **kwargs):
        if group_code is None:
            group_code = kwargs.get('username')

        if not group_code or password is None:
            return None

        try:
            user = User.objects.get(group_code=str(group_code).strip())
        except User.DoesNotExist:
            # Run the default password hasher to reduce user-enumeration timing leaks.
            User().set_password(password)
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
