from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField

from employees.models import Employee


class TimeLog(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="time_logs")
    work_date = models.DateField(db_index=True)
    clock_in = models.DateTimeField()
    clock_in_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    clock_in_lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    clock_in_address = models.TextField(blank=True)
    clock_in_notes = models.TextField(blank=True)
    clock_in_photo = models.ImageField(upload_to="time_logs/photos/", null=True, blank=True)

    clock_out = models.DateTimeField(null=True, blank=True)
    clock_out_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    clock_out_lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    clock_out_address = models.TextField(blank=True)
    clock_out_notes = models.TextField(blank=True)
    clock_out_photo = models.ImageField(upload_to="time_logs/photos/", null=True, blank=True)

    notes = models.TextField(blank=True)  # General notes / system info

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["employee", "work_date"]),
        ]

    @property
    def is_open(self) -> bool:
        return self.clock_out is None

    def break_seconds(self) -> int:
        total = 0
        for b in self.breaks.all():
            if b.break_end:
                total += int((b.break_end - b.break_start).total_seconds())
        return total

    def worked_seconds(self) -> int:
        if not self.clock_out:
            return 0
        raw = int((self.clock_out - self.clock_in).total_seconds())
        return max(0, raw - self.break_seconds())


class Break(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    time_log = models.ForeignKey(TimeLog, on_delete=models.CASCADE, related_name="breaks")
    break_start = models.DateTimeField()
    break_end = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_open(self) -> bool:
        return self.break_end is None
