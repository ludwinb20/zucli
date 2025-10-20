import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, Activity, User, FileText } from 'lucide-react';

interface ActivityItem {
  action: string;
  user: string;
  time: string;
  module: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  title?: string;
  description?: string;
}

const getModuleIcon = (module: string) => {
  switch (module.toLowerCase()) {
    case 'pagos':
      return FileText;
    case 'citas':
      return Clock;
    case 'pacientes':
      return User;
    default:
      return Activity;
  }
};

const getModuleColor = (module: string) => {
  switch (module.toLowerCase()) {
    case 'pagos':
      return 'text-green-600 bg-green-100';
    case 'citas':
      return 'text-blue-600 bg-blue-100';
    case 'pacientes':
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
};

export function RecentActivity({
  activities,
  title = 'Actividad Reciente',
  description = 'Últimas acciones realizadas en el sistema',
}: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hay actividad reciente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((item, index) => {
            const Icon = getModuleIcon(item.module);
            const colorClass = getModuleColor(item.module);

            return (
              <div
                key={index}
                className="flex items-start gap-3 py-2 border-b last:border-b-0 border-gray-100"
              >
                <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.action}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {item.user}
                  </p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatTimeAgo(item.time)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

