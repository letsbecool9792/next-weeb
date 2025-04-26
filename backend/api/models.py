from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) 
    mal_access_token = models.CharField(max_length=255, blank = True, null = True) 

    name = models.CharField(max_length=100, blank=True, null=True)
    birthday = models.DateField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    joined_at = models.DateTimeField(blank=True, null=True)
    picture = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return self.user.username


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

