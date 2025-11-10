'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [activeTab, setActiveTab] = useState<'notifications' | 'rules'>('notifications');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    try {
      const [notificationsData, rulesData, countData] = await Promise.all([
        apiClient.getAlertNotifications(),
        apiClient.getAlertRules(),
        apiClient.getUnreadNotificationCount(),
      ]);

      setNotifications(notificationsData);
      setRules(rulesData);
      setUnreadCount(countData.count);
    } catch (error: any) {
      toast.error('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id);
      loadData();
    } catch (error: any) {
      toast.error('Failed to mark as read');
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await apiClient.acknowledgeNotification(id);
      toast.success('Notification acknowledged');
      loadData();
    } catch (error: any) {
      toast.error('Failed to acknowledge notification');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await apiClient.resolveNotification(id);
      toast.success('Notification resolved');
      loadData();
    } catch (error: any) {
      toast.error('Failed to resolve notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      toast.success('All notifications marked as read');
      loadData();
    } catch (error: any) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      await apiClient.toggleAlertRule(id);
      toast.success('Rule toggled successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to toggle rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await apiClient.deleteAlertRule(id);
      toast.success('Rule deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to delete rule');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-500';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading alerts...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="space-x-2">
            {activeTab === 'notifications' && unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="btn-secondary">
                Mark All as Read
              </button>
            )}
            {activeTab === 'rules' && (
              <button onClick={() => router.push('/alerts/new')} className="btn-primary">
                Create Alert Rule
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rules'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alert Rules ({rules.length})
            </button>
          </nav>
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-500">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`card border-l-4 ${getSeverityColor(notification.severity)} ${
                    notification.status === 'unread' ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                            notification.severity
                          )}`}
                        >
                          {notification.severity.toUpperCase()}
                        </span>
                        {notification.status === 'unread' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mt-2">{notification.message}</p>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Entity:</span>
                          <span className="ml-2 font-medium">{notification.entityName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Metric:</span>
                          <span className="ml-2 font-medium">{notification.metric}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Value:</span>
                          <span className="ml-2 font-medium">
                            {notification.currentValue.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <span className="ml-2 font-medium">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {notification.actionsTaken?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">Actions Taken:</p>
                          <ul className="mt-1 space-y-1">
                            {notification.actionsTaken.map((action: any, idx: number) => (
                              <li key={idx} className="text-sm text-gray-600">
                                {action.action} - {action.status}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      {notification.status === 'unread' && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 whitespace-nowrap"
                        >
                          Mark as Read
                        </button>
                      )}
                      {notification.status !== 'acknowledged' && (
                        <button
                          onClick={() => handleAcknowledge(notification._id)}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 whitespace-nowrap"
                        >
                          Acknowledge
                        </button>
                      )}
                      {notification.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolve(notification._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 whitespace-nowrap"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-500 mb-4">No alert rules configured</p>
                <button onClick={() => router.push('/alerts/new')} className="btn-primary">
                  Create Your First Rule
                </button>
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule._id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rule.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rule.priority)}`}>
                          {rule.priority.toUpperCase()}
                        </span>
                      </div>
                      {rule.description && (
                        <p className="text-gray-600 mt-2">{rule.description}</p>
                      )}
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Entity:</span>
                          <span className="ml-2 font-medium">{rule.entity.toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Metric:</span>
                          <span className="ml-2 font-medium">{rule.metric.toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Condition:</span>
                          <span className="ml-2 font-medium">
                            {rule.operator.replace(/_/g, ' ')} {rule.threshold}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Triggered:</span>
                          <span className="ml-2 font-medium">{rule.triggerCount} times</span>
                        </div>
                      </div>
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Channels:</span>
                        <span className="ml-2">
                          {rule.notificationChannels.map((ch: any) => ch.type).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => handleToggleRule(rule._id)}
                        className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                          rule.enabled
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => router.push(`/alerts/rules/${rule._id}`)}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 whitespace-nowrap"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
