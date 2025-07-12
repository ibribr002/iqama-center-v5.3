import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Pusher from 'pusher-js';
import AIAssistant from './AIAssistant';

const Sidebar = ({ user, currentPath }) => {
    const navLinks = [
        { href: '/dashboard', text: 'لوحة التحكم', icon: 'fa-tachometer-alt', roles: ['admin', 'student', 'teacher', 'parent', 'head', 'finance', 'worker'] },
        { href: '/courses', text: 'الدورات', icon: 'fa-book', roles: ['student', 'teacher', 'worker', 'parent'] },
        { title: 'إدارة النظام', roles: ['admin'] },
        { href: '/admin/users', text: 'إدارة المستخدمين', icon: 'fa-users-cog', roles: ['admin'] },
        { href: '/admin/courses/manage', text: 'إدارة الدورات الشاملة', icon: 'fa-cogs', roles: ['admin', 'head'] },
        { href: '/finance', text: 'إدارة المدفوعات', icon: 'fa-money-bill-wave', roles: ['admin'] },
        { href: '/admin/requests', text: 'طلبات التعديل', icon: 'fa-check-square', roles: ['admin'] },
        { title: 'عام', roles: ['admin', 'student', 'teacher', 'parent', 'head', 'finance', 'worker'] },
        { href: '/messages', text: 'الرسائل', icon: 'fa-envelope', roles: ['admin', 'student', 'teacher', 'parent', 'head', 'finance', 'worker'] },
        { href: '/finance', text: 'المالية', icon: 'fa-wallet', roles: ['student', 'parent', 'worker'] },
        { href: '/performance', text: 'تقارير الأداء', icon: 'fa-chart-line', roles: ['student', 'parent'] },
        { href: '/completed-courses', text: 'السجل الدراسي', icon: 'fa-history', roles: ['student', 'parent'] },
        { href: '/profile', text: 'الملف الشخصي', icon: 'fa-user-circle', roles: ['admin', 'student', 'teacher', 'parent', 'head', 'finance', 'worker'] },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">إقامة الكتاب</div>
            <ul className="sidebar-nav">
                {navLinks.map((link, index) => {
                    if (link.roles && !link.roles.includes(user.role)) {
                        return null;
                    }
                    if (link.title) {
                        return <li key={index} className="nav-title">{link.title}</li>;
                    }
                    return (
                        <li key={index}>
                            <Link href={link.href} legacyBehavior>
                                <a className={currentPath === link.href ? 'active' : ''}>
                                    <i className={`fas ${link.icon} fa-fw`}></i> {link.text}
                                </a>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
};

const Header = ({ user, onLogout }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/notifications');
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.is_read).length);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchNotifications();

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            authEndpoint: '/api/pusher/auth',
        });
        const channel = pusher.subscribe(`private-user-${user.id}`);
        channel.bind('new-notification', (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            pusher.unsubscribe(`private-user-${user.id}`);
            pusher.disconnect();
        };
    }, [user.id]);

    const handleBellClick = async () => {
        setIsDropdownOpen(!isDropdownOpen);
        if (!isDropdownOpen && unreadCount > 0) {
            try {
                await fetch('/api/notifications/mark-read', { method: 'POST' });
                setUnreadCount(0);
            } catch (error) {
                console.error("Failed to mark notifications as read:", error);
            }
        }
    };

    return (
        <header className="dashboard-header">
            <div className="header-left"></div>
            <div className="header-right">
                <div className="notifications-bell" onClick={handleBellClick}>
                    <i className="fas fa-bell"></i>
                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                    {isDropdownOpen && (
                        <div className="notifications-dropdown show">
                            <div className="notification-header">الإشعارات</div>
                            <div className="notification-list">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <Link key={n.id} href={n.link || '#'} legacyBehavior>
                                        <a className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
                                            <span className="msg">{n.message}</span>
                                            <span className="time">{new Date(n.created_at).toLocaleString('ar-EG')}</span>
                                        </a>
                                    </Link>
                                )) : <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>لا توجد إشعارات</div>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="user-menu">
                    <span>أهلاً, {user.full_name}</span>
                    <button onClick={onLogout} title="تسجيل الخروج"><i className="fas fa-sign-out-alt"></i></button>
                </div>
            </div>
        </header>
    );
};

const Layout = ({ user, children }) => {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout');
        router.push('/login');
    };

    const isParentView = user?.is_view_token;
    const isPaymentLocked = user?.details?.is_payment_locked;

    return (
        <>
            <Head>
                <title>لوحة التحكم - مركز إقامة الكتاب</title>
            </Head>
            <div className="dashboard-wrapper">
                <Sidebar user={user} currentPath={router.pathname} />
                <Header user={user} onLogout={handleLogout} />
                <main className="dashboard-main-content">
                    {isParentView && (
                        <div className="view-mode-banner">
                            <i className="fas fa-eye"></i> <strong>وضع المشاهدة:</strong> أنت الآن تتصفح لوحة تحكم: <strong>{user.full_name}</strong>.
                        </div>
                    )}
                    {isPaymentLocked && (
                         <div className="payment-lock-overlay">
                            <div className="message-box">
                                <h2><i className="fas fa-lock"></i> تم تقييد الوصول</h2>
                                <p>لقد تم تقييد وصولك إلى المنصة بسبب تأخر سداد المصروفات. يرجى التوجه إلى قسم المالية لتسوية المستحقات.</p>
                                <Link href="/finance" legacyBehavior><a className="btn-primary">الذهاب إلى قسم المالية</a></Link>
                            </div>
                        </div>
                    )}
                    <div style={{ filter: isPaymentLocked ? 'blur(5px)' : 'none', pointerEvents: isPaymentLocked ? 'none' : 'auto', height: '100%' }}>
                        {children}
                    </div>
                </main>
            </div>
            <AIAssistant />
            <style jsx global>{`
                :root { 
                    --primary-color: #0056b3; 
                    --dark-color: #2c3e50; 
                    --light-color: #f4f7f9; 
                    --white-color: #fff; 
                    --danger-color: #e74c3c; 
                    --success-color: #27ae60;
                    --sidebar-width: 260px; 
                    --header-height: 60px; 
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { 
                    font-family: 'Tajawal', sans-serif; 
                    background-color: var(--light-color); 
                    overflow: hidden;
                }
                .dashboard-wrapper { 
                    display: grid; 
                    grid-template-columns: var(--sidebar-width) 1fr; 
                    grid-template-rows: var(--header-height) 1fr; 
                    height: 100vh; 
                    width: 100vw;
                }
                .sidebar {
                    grid-row: 1 / -1;
                    grid-column: 1 / 2;
                    background-color: var(--dark-color);
                    color: var(--white-color);
                    display: flex;
                    flex-direction: column;
                    z-index: 20;
                }
                .sidebar-logo { padding: 15px; text-align: center; font-size: 1.5rem; font-weight: bold; background-color: rgba(0,0,0,0.2); }
                .sidebar-nav { flex-grow: 1; list-style: none; padding: 0; margin-top: 20px; }
                .sidebar-nav li a { display: block; padding: 15px 20px; color: var(--light-color); text-decoration: none; transition: background 0.2s, padding-right 0.2s; }
                .sidebar-nav li a:hover, .sidebar-nav li a.active { background-color: var(--primary-color); padding-right: 25px; }
                .sidebar-nav .nav-title { padding: 10px 20px; font-size: 0.8rem; color: #95a5a6; text-transform: uppercase; }
                .dashboard-header { 
                    grid-row: 1 / 2;
                    grid-column: 2 / -1;
                    background-color: var(--white-color); 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    padding: 0 30px; 
                    border-bottom: 1px solid #e0e0e0;
                    z-index: 10;
                }
                .header-right { display: flex; align-items: center; gap: 25px; }
                .notifications-bell { position: relative; cursor: pointer; }
                .notifications-bell .fa-bell { font-size: 1.3rem; color: #555; }
                .notifications-bell .badge { position: absolute; top: -5px; right: -8px; background: var(--danger-color); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; justify-content: center; align-items: center; }
                .user-menu { display: flex; align-items: center; gap: 10px; }
                .user-menu button { background: none; border: none; color: var(--danger-color); cursor: pointer; font-size: 1.2rem; }
                .dashboard-main-content {
                    grid-row: 2 / -1;
                    grid-column: 2 / -1;
                    padding: 30px;
                    overflow-y: auto;
                    height: calc(100vh - var(--header-height));
                }
                .notifications-dropdown { display: none; position: absolute; top: 45px; left: -150px; width: 320px; background: white; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); z-index: 100; border: 1px solid #eee; }
                .notifications-dropdown.show { display: block; }
                .notification-header { padding: 12px 15px; font-weight: bold; border-bottom: 1px solid #eee; }
                .notification-list { max-height: 350px; overflow-y: auto; }
                .notification-item { display: block; padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333; transition: background-color 0.2s; }
                .notification-item:hover { background-color: #f7f7f7; }
                .notification-item.unread { background-color: #eaf5ff; }
                .notification-item .msg { display: block; margin-bottom: 5px; font-size: 0.9rem; }
                .notification-item .time { font-size: 0.75rem; color: #888; }
                .payment-lock-overlay { position: fixed; top: 0; right: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1000; display: flex; justify-content: center; align-items: center; text-align: center; color: white; }
                .payment-lock-overlay .message-box { background: var(--white-color); color: var(--dark-color); padding: 40px; border-radius: 8px; max-width: 500px; }
                .payment-lock-overlay .btn-primary { color: white; background: var(--primary-color); padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 15px; }
                .view-mode-banner { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ffeeba; }
            `}</style>
        </>
    );
};

export default Layout;
