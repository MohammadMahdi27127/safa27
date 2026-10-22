from django.contrib.auth.backends import ModelBackend
from .models import User

class GroupCodeAuthBackend(ModelBackend):
    def authenticate(self, request, group_code=None, password=None, **kwargs):
        if group_code is None:
            group_code = kwargs.get('username')
        try:
            user = User.objects.get(group_code=group_code)
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None
        return None