"""
Core scheduler module — delegates to apps.jobs.scheduler.

The canonical scheduler implementation lives in apps/jobs/scheduler.py.
This module exists for backward compatibility.
"""


def initialize_scheduler():
    """Initialize the scheduler (delegates to jobs app)."""
    from apps.jobs.scheduler import start_scheduler
    start_scheduler()


def get_scheduler():
    """Get the scheduler instance (not used in current implementation)."""
    return None
