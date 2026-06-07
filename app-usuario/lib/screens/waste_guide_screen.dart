import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:recolecta_celaya/constants/app_colors.dart';
import 'package:recolecta_celaya/screens/waste_detail_screen.dart';
import 'package:recolecta_celaya/widgets/shared_bottom_nav.dart';

class WasteCategory {
  final String name;
  final Color color;
  final IconData icon;
  final String description;
  final List<String> goesIn;
  final List<String> doesntGoIn;
  final List<String> keywords;

  const WasteCategory({
    required this.name,
    required this.color,
    required this.icon,
    required this.description,
    required this.goesIn,
    required this.doesntGoIn,
    required this.keywords,
  });
}

const List<WasteCategory> wasteCategories = [
  WasteCategory(
    name: 'Orgánicos',
    color: AppColors.organics,
    icon: Icons.eco,
    description: 'Restos de comida y jardín',
    goesIn: [
      'Cáscaras de frutas y verduras',
      'Restos de comida cocida',
      'Hojas, pasto y ramas pequeñas',
      'Café molido y bolsas de té',
      'Cáscaras de huevo',
      'Servilletas de papel sucias de comida',
    ],
    doesntGoIn: [
      'Aceite de cocina usado',
      'Carne con hueso grande',
      'Lácteos en grandes cantidades',
      'Plásticos etiquetados "biodegradables"',
    ],
    keywords: [
      'fruta', 'verdura', 'comida', 'pasto', 'hoja', 'cáscara', 'café',
      'huevo', 'servilleta', 'orgánico',
    ],
  ),
  WasteCategory(
    name: 'Reciclables',
    color: AppColors.recyclables,
    icon: Icons.recycling,
    description: 'Materiales con valor de reutilización',
    goesIn: [
      'Botellas PET (agua, refresco)',
      'Latas de aluminio',
      'Cartón y papel limpio',
      'Vidrio limpio (botellas, frascos)',
      'Periódico y revistas',
      'Cajas de cereales y leche (limpias)',
    ],
    doesntGoIn: [
      'Papel sucio o grasoso (cajas de pizza)',
      'Vidrio roto o de ventana',
      'Bolsas plásticas sucias',
      'Tetra pak con restos de líquido',
    ],
    keywords: [
      'botella', 'PET', 'lata', 'aluminio', 'cartón', 'papel', 'vidrio',
      'periódico', 'revista', 'caja', 'plástico', 'reciclable',
    ],
  ),
  WasteCategory(
    name: 'Sanitarios',
    color: AppColors.sanitary,
    icon: Icons.local_hospital_outlined,
    description: 'Residuos de higiene personal',
    goesIn: [
      'Pañales desechables',
      'Toallas sanitarias y tampones',
      'Papel de baño y pañuelos usados',
      'Algodón y gasas de uso doméstico',
      'Hilo dental',
    ],
    doesntGoIn: [
      'Medicamentos vencidos',
      'Jeringas y agujas',
      'Termómetros de mercurio',
      'Residuos hospitalarios o clínicos',
    ],
    keywords: [
      'pañal', 'toalla', 'papel', 'baño', 'algodón', 'gasa', 'hilo dental',
      'pañuelo', 'sanitario', 'higiene',
    ],
  ),
  WasteCategory(
    name: 'Especiales',
    color: AppColors.special,
    icon: Icons.warning_amber_rounded,
    description: 'Voluminosos, eléctricos y peligrosos',
    goesIn: [
      'Electrodomésticos (licuadoras, planchas)',
      'Muebles y colchones',
      'Pilas y baterías alcalinas',
      'Celulares y electrónicos',
      'Escombros de obra pequeña',
    ],
    doesntGoIn: [
      'Residuos médicos o clínicos',
      'Químicos industriales (thinner, solventes)',
      'Tanques de gas vacíos',
      'Materiales radioactivos',
    ],
    keywords: [
      'electrónico', 'mueble', 'colchón', 'pila', 'batería', 'celular',
      'escombro', 'licuadora', 'plancha', 'especial', 'voluminoso',
    ],
  ),
];

class WasteGuideScreen extends StatefulWidget {
  const WasteGuideScreen({Key? key}) : super(key: key);

  @override
  State<WasteGuideScreen> createState() => _WasteGuideScreenState();
}

class _WasteGuideScreenState extends State<WasteGuideScreen> {
  final _searchController = TextEditingController();
  WasteCategory? _searchResult;
  bool _searched = false;

  void _onSearch(String query) {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResult = null;
        _searched = false;
      });
      return;
    }
    final q = query.toLowerCase().trim();
    WasteCategory? found;
    for (final cat in wasteCategories) {
      if (cat.keywords.any((k) => k.contains(q) || q.contains(k))) {
        found = cat;
        break;
      }
    }
    setState(() {
      _searchResult = found;
      _searched = true;
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightGrayBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    _buildSearchBar(),
                    const SizedBox(height: 16),
                    if (_searched) _buildSearchResult() else _buildCategories(context),
                    const SizedBox(height: 16),
                    _buildOfflineBadge(),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const SharedBottomNav(currentIndex: 0),
    );
  }

  Widget _buildHeader() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      child: Row(
        children: [
          const Icon(Icons.delete_sweep_outlined,
              color: AppColors.primaryBlue, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Guía de Separación',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryBlue,
                  ),
                ),
                Text(
                  'Aprende a separar correctamente tus residuos',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 10,
              offset: const Offset(0, 3)),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: _onSearch,
        style: const TextStyle(fontSize: 15),
        decoration: InputDecoration(
          hintText: '¿Dónde tiro el unicel? Busca aquí...',
          hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
          prefixIcon: const Icon(Icons.search, color: AppColors.aquaGreen),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    _onSearch('');
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        ),
      ),
    );
  }

  Widget _buildCategories(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 14,
      mainAxisSpacing: 14,
      childAspectRatio: 0.95,
      children: wasteCategories
          .map((cat) => _buildCategoryCard(context, cat))
          .toList(),
    );
  }

  Widget _buildCategoryCard(BuildContext context, WasteCategory cat) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => WasteDetailScreen(category: cat)),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [cat.color, cat.color.withValues(alpha: 0.75)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
                color: cat.color.withValues(alpha: 0.35),
                blurRadius: 10,
                offset: const Offset(0, 5)),
          ],
        ),
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(cat.icon, color: Colors.white, size: 30),
            ),
            const Spacer(),
            Text(
              cat.name,
              style: GoogleFonts.poppins(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 17),
            ),
            const SizedBox(height: 4),
            Text(
              cat.description,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85), fontSize: 11),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  'Ver detalle',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.9),
                      fontSize: 11,
                      fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 4),
                Icon(Icons.arrow_forward_ios,
                    size: 10, color: Colors.white.withValues(alpha: 0.9)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResult() {
    if (_searchResult == null) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(Icons.search_off, size: 48, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text('No encontramos ese residuo.',
                style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600, color: Colors.grey[600])),
            const SizedBox(height: 6),
            Text(
              'Intenta con otra palabra o explora las categorías.',
              style: TextStyle(fontSize: 13, color: Colors.grey[400]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                _searchController.clear();
                _onSearch('');
              },
              child: const Text('Ver todas las categorías'),
            ),
          ],
        ),
      );
    }

    final cat = _searchResult!;
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => WasteDetailScreen(category: cat)),
      ),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: cat.color,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
                color: cat.color.withValues(alpha: 0.3),
                blurRadius: 10,
                offset: const Offset(0, 4)),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(cat.icon, color: Colors.white, size: 32),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Va en: ${cat.name}',
                    style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16),
                  ),
                  Text(cat.description,
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 12)),
                  const SizedBox(height: 6),
                  Text('Toca para ver más →',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOfflineBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.aquaGreen.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.aquaGreen.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.offline_bolt_outlined,
              color: AppColors.aquaGreen, size: 18),
          const SizedBox(width: 8),
          Text(
            'Disponible sin conexión a internet',
            style: TextStyle(
                fontSize: 12,
                color: AppColors.aquaGreen,
                fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
