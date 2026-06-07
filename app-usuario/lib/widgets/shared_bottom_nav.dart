import 'package:flutter/material.dart';
import 'package:recolecta_celaya/constants/app_colors.dart';

class SharedBottomNav extends StatelessWidget {
  final int currentIndex;
  const SharedBottomNav({Key? key, required this.currentIndex}) : super(key: key);

  void _onTap(BuildContext context, int index) {
    if (index == currentIndex) return;
    final routes = ['/dashboard', null, '/reports', '/perfil'];
    final route = routes[index];
    if (route == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Próximamente: Calendario de rutas'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    Navigator.pushNamedAndRemoveUntil(context, route, (r) => false);
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      type: BottomNavigationBarType.fixed,
      selectedItemColor: AppColors.aquaGreen,
      unselectedItemColor: Colors.grey,
      showUnselectedLabels: true,
      onTap: (i) => _onTap(context, i),
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Inicio'),
        BottomNavigationBarItem(icon: Icon(Icons.calendar_month), label: 'Calendario'),
        BottomNavigationBarItem(icon: Icon(Icons.history), label: 'Reportes'),
        BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
      ],
    );
  }
}
