import base64
import functools
import jwt
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework import status


def decode_jwt(request):
    """
    Decodes the JWT from the HttpOnly 'jwt' cookie set by Spring Boot.
    Returns the full payload dict on success.
    Raises AuthenticationFailed on any error.
    """
    token = request.COOKIES.get('jwt')
    if not token:
        raise AuthenticationFailed('Missing JWT cookie.')

    try:
        secret = base64.b64decode(settings.JWT_SECRET).decode('utf-8')
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        if not payload.get('sub'):
            raise AuthenticationFailed('Invalid token: missing subject.')
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token has expired.')
    except jwt.InvalidTokenError as e:
        raise AuthenticationFailed(f'Invalid token: {e}')


def require_auth(roles=None):
    """
    Decorator for APIView methods that enforces JWT authentication
    and optional role-based access control.

    Usage — authentication only:
        @require_auth()
        def get(self, request): ...

    Usage — restrict to specific roles:
        @require_auth(roles=['ROLE_ADMIN'])
        def get(self, request): ...
    """
    def decorator(view_method):
        @functools.wraps(view_method)
        def wrapper(self, request, *args, **kwargs):
            try:
                payload = decode_jwt(request)
            except AuthenticationFailed as e:
                return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

            if roles:
                user_roles = payload.get('roles', [])
                if not any(r in user_roles for r in roles):
                    return Response(
                        {'error': 'Forbidden: insufficient role.'},
                        status=status.HTTP_403_FORBIDDEN
                    )

            request.jwt_payload = payload
            return view_method(self, request, *args, **kwargs)
        return wrapper
    return decorator
