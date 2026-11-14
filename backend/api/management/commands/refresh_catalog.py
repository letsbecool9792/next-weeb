"""
python manage.py refresh_catalog

Downloads MAL's most popular shows into the Anime table. Run by build.sh on
every deploy. A MAL outage must not fail the deploy, so errors are reported
and the existing catalog is kept.
"""
from django.core.management.base import BaseCommand

from api.catalog import CATALOG_SIZE, refresh_catalog
from api.mal import MalError


class Command(BaseCommand):
    help = "Download MAL's most popular shows into the local catalog."

    def add_arguments(self, parser):
        parser.add_argument("--size", type=int, default=CATALOG_SIZE)

    def handle(self, *args, size, **options):
        try:
            count = refresh_catalog(size)
        except MalError as e:
            self.stderr.write(f"Catalog refresh failed, keeping the existing catalog: {e.detail}")
            return
        self.stdout.write(f"Catalog refreshed: {count} shows")
