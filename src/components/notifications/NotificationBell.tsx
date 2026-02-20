import React, { useState } from 'react';
import { Badge, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faTimes, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { useSignalR } from '../../hooks/useSignalR';
import signalRService from '../../services/signalRService';

export const NotificationBell: React.FC = () => {
  const { notifications, clearNotifications, removeNotification, isConnected } = useSignalR();
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.length;

  const handleMarkAllAsRead = () => {
    clearNotifications();
    setShowDropdown(false);
  };

  const handleNotificationClick = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notificationId && removeNotification) {
      removeNotification(notificationId);
    }
  };

  const handleRemoveNotification = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notificationId && removeNotification) {
      removeNotification(notificationId);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return time.toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <Dropdown show={showDropdown} onToggle={(isOpen) => {
      if (typeof isOpen === 'boolean') {
        setShowDropdown(isOpen);
      }
    }}>
      <Dropdown.Toggle
        variant="link"
        className="p-0 border-0 position-relative"
        style={{ background: 'none', boxShadow: 'none' }}
      >
        <FontAwesomeIcon 
          icon={faBell} 
          size="lg" 
          className={`text-${isConnected ? 'primary' : 'muted'}`}
        />
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            pill 
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.7rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu align="end" style={{ minWidth: '350px', maxHeight: '450px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backgroundColor: 'var(--modal-bg)' }}>
        <Dropdown.Header className="d-flex justify-content-between align-items-center py-3 px-3 border-bottom" style={{ backgroundColor: 'var(--bg-secondary)', borderBottomColor: 'var(--border-color) !important' }}>
          <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
          {unreadCount > 0 && (
            <button 
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={handleMarkAllAsRead}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              <FontAwesomeIcon icon={faCheckDouble} size="xs" />
              Mark all as read
            </button>
          )}
        </Dropdown.Header>
        
        {notifications.length === 0 ? (
          <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
            <FontAwesomeIcon icon={faBell} size="2x" className="mb-3 opacity-50" />
            <div>No new notifications</div>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.slice(-10).reverse().map((notification, index) => {
              // Debug log to see the actual structure
              console.log('Notification structure:', notification);
              
              // Handle different possible data structures
              let notificationData;
              if (notification.Payload) {
                notificationData = notification.Payload;
              } else if (notification.payload) {
                notificationData = notification.payload;
              } else {
                notificationData = notification;
              }
              
              const timeAgo = getTimeAgo(notificationData.timestamp || notification.receivedAt || notification.timestamp);
              
              return (
                <div 
                  key={notification.id || index} 
                  className="notification-item p-3 border-bottom position-relative"
                  onClick={(e) => handleNotificationClick(notification.id, e)}
                  style={{ 
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: 'var(--modal-bg)',
                    borderBottomColor: 'var(--border-color)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--modal-bg)'}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1 pe-2">
                      <div className="fw-semibold mb-1" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {notificationData.title || notificationData.Title || 'Notification'}
                      </div>
                      <div className="mb-2" style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                        {notificationData.message || notificationData.Message || 'No message'}
                      </div>
                      <div className="d-flex align-items-center" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>{timeAgo}</span>
                        {notificationData.type && (
                          <span className={`ms-2 badge bg-${getTypeColor(notificationData.type)}`} style={{ fontSize: '0.65rem' }}>
                            {notificationData.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      className="btn btn-sm btn-link p-1"
                      onClick={(e) => handleRemoveNotification(notification.id, e)}
                      title="Mark as read"
                      style={{ fontSize: '0.8rem', minWidth: '24px', color: 'var(--text-muted)' }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        

      </Dropdown.Menu>
    </Dropdown>
  );
};