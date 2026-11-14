from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) 
    # MAL access tokens are ~780 characters, so this cannot be a short CharField.
    mal_access_token = models.TextField(blank=True, null=True)
    # Lets us get a new access token without sending the user back to MAL.
    mal_refresh_token = models.TextField(blank=True, null=True)
    mal_token_expires_at = models.DateTimeField(blank=True, null=True)
    # When the anime list was last copied from MAL. Empty means never.
    last_synced_at = models.DateTimeField(blank=True, null=True)

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

    # Facts about the show itself, copied from MAL at sync time
    genres = models.JSONField(default=list)       # list of genre names
    studios = models.JSONField(default=list)      # list of studio names
    num_episodes = models.IntegerField(default=0)  # 0 when MAL does not know yet
    average_episode_duration = models.IntegerField(default=0)  # seconds
    media_type = models.CharField(max_length=20, blank=True, default="")
    mean = models.FloatField(null=True, blank=True)            # community score
    popularity = models.IntegerField(null=True, blank=True)    # rank by members, 1 = most popular
    num_list_users = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'mal_id')

