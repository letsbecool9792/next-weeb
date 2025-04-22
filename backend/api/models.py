from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) # says this profile belongs to one user
    mal_access_token = models.CharField(max_length=255, blank = True, null = True) # mal acess token is stored here


class AnimeEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='anime_entries')
    mal_id = models.IntegerField()
    title = models.CharField(max_length=255)
    image_url = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=50)
    score = models.FloatField(null=True, blank=True)
    episodes_watched = models.IntegerField(null=True, blank=True)
    is_rewatching = models.BooleanField(default=False)
    start_date = models.DateField(null=True, blank=True)
    finish_date = models.DateField(null=True, blank=True)
    last_updated = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'mal_id')

