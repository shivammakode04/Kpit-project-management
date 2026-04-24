from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from apps.jobs.models import BackgroundJob
from apps.jobs.serializers import BackgroundJobSerializer, TriggerJobSerializer
from apps.jobs.scheduler import trigger_job


class JobListView(generics.ListAPIView):
    """List recent background jobs (admin only)."""
    serializer_class = BackgroundJobSerializer
    permission_classes = [IsAuthenticated]
    queryset = BackgroundJob.objects.all()


class TriggerJobView(APIView):
    """Manually trigger a background job (admin only)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TriggerJobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        job_type = serializer.validated_data['job_type']
        try:
            result = trigger_job(job_type)
            return Response({
                'detail': f'Job "{job_type}" triggered successfully.',
                'result': str(result) if result else 'Completed',
            })
        except Exception as exc:
            return Response(
                {'detail': f'Job failed: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
