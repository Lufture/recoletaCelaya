// lib/features/notifications/presentation/screens/notifications_screen.dart
import 'package:flutter/material.dart';
import 'package:recolecta_chofer/core/constants/app_colors.dart';
import 'package:recolecta_chofer/core/constants/app_text_styles.dart';
import 'package:recolecta_chofer/features/notifications/data/notification_service.dart';
import 'package:recolecta_chofer/core/widgets/app_bottom_nav.dart';
import 'package:recolecta_chofer/core/widgets/status_pill.dart';
import 'package:recolecta_chofer/features/notifications/presentation/widgets/notif_item_tile.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _notificationService = NotificationService();
  bool _isLoading = true;
  List<Map<String, dynamic>> _notifications = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final notifs = await _notificationService.getNotifications();
    if (mounted) {
      setState(() {
        _notifications = notifs;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Avisos del admin', style: AppTextStyles.heading3),
        automaticallyImplyLeading: false,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: StatusPill(label: '${_notifications.where((n) => n['leido'] != true).length} nuevos', color: AppColors.blueInfo),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.greenActive))
          : _notifications.isEmpty
              ? Center(
                  child: Text(
                    'No hay notificaciones',
                    style: AppTextStyles.body.copyWith(color: AppColors.textSecondary),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notifications.length,
                  itemBuilder: (context, index) {
                    final notif = _notifications[index];
                    String timeStr = 'Reciente';
                    if (notif['fecha_envio'] != null) {
                      final dt = DateTime.tryParse(notif['fecha_envio'])?.toLocal();
                      if (dt != null) {
                        timeStr = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
                      }
                    }

                    return GestureDetector(
                      onTap: () {
                        if (notif['leido'] != true) {
                          _notificationService.markAsRead(notif['id']);
                          setState(() => notif['leido'] = true);
                        }
                      },
                      child: NotifItemTile(
                        icon: Icons.notifications_none_rounded,
                        iconBg: AppColors.blueInfo.withOpacity(0.25),
                        title: notif['titulo'] ?? 'Aviso',
                        body: notif['mensaje'] ?? '',
                        time: timeStr,
                        isUnread: notif['leido'] != true,
                      ),
                    );
                  },
                ),
      bottomNavigationBar: AppBottomNav(currentIndex: 4),
    );
  }
}