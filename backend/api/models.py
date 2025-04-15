from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) # says this profile belongs to one user
    mal_access_token = models.CharField(max_length=255, blank = True, null = True) # mal acess token is stored here
