"""
Django settings for UpToDate project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
PROJECT_ROOT = os.path.normpath(os.path.dirname(__file__)+'/..')

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "DEBUG")
DEBUG = 'true' if SECRET_KEY == "DEBUG" else 'false'
TEMPLATE_DEBUG = DEBUG

ALLOWED_HOSTS = ['isyourprojectuptodate.com', 'iyputd.com', 'iyputd.ninetwozero.com']


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'frontend',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'IsYourProjectUpToDate.urls'

WSGI_APPLICATION = 'IsYourProjectUpToDate.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_ROOT = "/var/www/public/iyputd.com/public/IsYourProjectUpToDate"
STATIC_URL = '/static/'

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, "static"),
    '/var/www/public/iyputd.com/public/IsYourProjectUpToDate/static/',
)

# LOGGING
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console':{
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
    },
    'formatters' : {
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'loggers': {
        'YOLO': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        }
    }
}

CONFIG = {
    'working_dir': '/var/www/public/iyputd.com/public/IsYourProjectUpToDate',
    'args': (
        '--bind=127.0.0.1:8000',
        '--workers=5',
        '--timeout=60',
        'IsYourProjectUpToDate.IsYourProjectUpToDate',
    ),
}

#ADMINS = ["support@ninetwozero.com"]
#MANAGERS = ["support@ninetwozero.com"]
