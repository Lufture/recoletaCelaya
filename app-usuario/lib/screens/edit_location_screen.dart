import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:recolecta_celaya/constants/app_colors.dart';
import 'package:recolecta_celaya/services/location_service.dart';

class EditLocationScreen extends StatefulWidget {
  const EditLocationScreen({Key? key}) : super(key: key);

  @override
  State<EditLocationScreen> createState() => _EditLocationScreenState();
}

class _EditLocationScreenState extends State<EditLocationScreen> {
  final _searchController = TextEditingController();
  final MapController _mapController = MapController();
  
  String? _selectedTag;
  bool _isLoading = true;
  bool _isSearching = false;
  Timer? _debounce;
  
  List<Map<String, dynamic>> _searchResults = [];
  LatLng? _selectedLocation;
  String? _existingId;
  
  // Default to Celaya center if no location selected yet
  final LatLng _defaultLocation = const LatLng(20.5223, -100.8123);

  final List<Map<String, dynamic>> _tags = [
    {'label': 'Mi Casa', 'icon': Icons.home},
    {'label': 'Trabajo', 'icon': Icons.work},
    {'label': 'Casa Familiar', 'icon': Icons.people},
    {'label': 'Otro', 'icon': Icons.location_on},
  ];

  @override
  void initState() {
    super.initState();
    _loadExistingLocation();
  }

  Future<void> _loadExistingLocation() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        final existing = await Supabase.instance.client
            .from('domicilios_usuario')
            .select()
            .eq('usuario_id', user.id)
            .maybeSingle();

        if (existing != null && mounted) {
          setState(() {
            _existingId = existing['id'];
            _searchController.text = existing['calle'] ?? '';
            _selectedTag = existing['alias'];
            
            if (existing['latitud'] != null && existing['longitud'] != null) {
              _selectedLocation = LatLng(existing['latitud'], existing['longitud']);
              WidgetsBinding.instance.addPostFrameCallback((_) {
                 _mapController.move(_selectedLocation!, 16.0);
              });
            }
          });
        }
      }
    } catch (e) {
      debugPrint("Error cargando domicilio: $e");
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    
    if (query.length < 3) {
      setState(() {
        _searchResults = [];
      });
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 800), () async {
      setState(() => _isSearching = true);
      
      final results = await LocationService.searchAddress(query);
      
      if (mounted) {
        setState(() {
          _searchResults = results;
          _isSearching = false;
        });
      }
    });
  }

  void _selectLocation(Map<String, dynamic> result) {
    FocusScope.of(context).unfocus(); // Cerrar teclado
    
    setState(() {
      _searchController.text = result['display_name'];
      _selectedLocation = LatLng(result['lat'], result['lon']);
      _searchResults = []; // Ocultar resultados
    });
    
    // Mover el mapa a la nueva ubicación
    _mapController.move(_selectedLocation!, 16.0);
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoading = true);
    
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Los servicios de ubicación están desactivados.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Permisos de ubicación denegados.');
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        throw Exception('Los permisos de ubicación están denegados permanentemente.');
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high
      );

      final latLng = LatLng(position.latitude, position.longitude);
      
      // Intentar obtener el nombre de la calle (Reverse Geocoding)
      final addressName = await LocationService.reverseGeocode(latLng.latitude, latLng.longitude);

      if (mounted) {
        setState(() {
          _selectedLocation = latLng;
          if (addressName != null) {
            _searchController.text = addressName;
          } else {
            _searchController.text = 'Ubicación actual';
          }
        });
        _mapController.move(latLng, 16.0);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.orange),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightGrayBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue))
                : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Actualiza tu domicilio',
                      style: GoogleFonts.poppins(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryBlue,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Cambia tu dirección para recibir alertas en tu nueva ubicación.',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 24),

                    // Buscador y Botón de Ubicación
                    Row(
                      children: [
                        Expanded(child: _buildSearchField()),
                        const SizedBox(width: 10),
                        Container(
                          decoration: BoxDecoration(
                            color: AppColors.primaryBlue,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: [
                              BoxShadow(color: AppColors.primaryBlue.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3)),
                            ],
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.my_location, color: Colors.white),
                            onPressed: _isLoading ? null : _getCurrentLocation,
                            tooltip: 'Usar mi ubicación actual',
                          ),
                        ),
                      ],
                    ),
                    
                    // Resultados de búsqueda
                    if (_searchResults.isNotEmpty) _buildSearchResults(),
                    if (_isSearching)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 10),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                      
                    const SizedBox(height: 20),

                    // Mapa
                    _buildMapPreview(),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                         Icon(
                          _selectedLocation != null ? Icons.check_circle : Icons.info_outline, 
                          size: 14, 
                          color: _selectedLocation != null ? AppColors.aquaGreen : Colors.orange
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            _selectedLocation != null 
                              ? 'Ubicación seleccionada correctamente.' 
                              : 'Por favor, busca y selecciona una dirección válida.',
                            style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Etiqueta
                    Text(
                      'Etiqueta este lugar',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.darkBlue,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildTagSelector(),
                    const SizedBox(height: 32),

                    // Botón confirmar
                    _buildConfirmButton(context),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      color: Colors.white,
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context, false), // false indica que no se guardó
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.lightGrayBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.arrow_back_ios_new, size: 18),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text('Editar Ubicación',
              style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryBlue)
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchField() {
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
        style: const TextStyle(fontSize: 15),
        onChanged: _onSearchChanged,
        decoration: InputDecoration(
          hintText: 'Busca tu calle, colonia o C.P.',
          hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
          prefixIcon:
              const Icon(Icons.search, color: AppColors.aquaGreen),
          suffixIcon: IconButton(
            icon: const Icon(Icons.clear, color: Colors.grey),
            onPressed: () {
              _searchController.clear();
              setState(() {
                _searchResults = [];
                _selectedLocation = null;
              });
            },
          ),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _searchResults.length,
        separatorBuilder: (context, index) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final result = _searchResults[index];
          return ListTile(
            leading: const Icon(Icons.location_on, color: AppColors.aquaGreen),
            title: Text(
              result['display_name'],
              style: const TextStyle(fontSize: 13),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            onTap: () => _selectLocation(result),
          );
        },
      ),
    );
  }

  Widget _buildMapPreview() {
    return Container(
      height: 250,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: AppColors.aquaGreen.withValues(alpha: 0.4), width: 1.5),
        boxShadow: [
          BoxShadow(
              color: AppColors.aquaGreen.withValues(alpha: 0.1),
              blurRadius: 12,
              offset: const Offset(0, 4)),
        ],
      ),
      clipBehavior: Clip.hardEdge,
      child: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _selectedLocation ?? _defaultLocation,
              initialZoom: 13.0,
              onTap: (tapPosition, point) {
                setState(() {
                  _selectedLocation = point;
                });
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.hackathon.recolectacelaya',
              ),
              if (_selectedLocation != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _selectedLocation!,
                      width: 50,
                      height: 50,
                      child: const Icon(
                        Icons.location_on,
                        color: Colors.red,
                        size: 40,
                      ),
                    ),
                  ],
                ),
            ],
          ),
          
          if (_selectedLocation != null)
            Positioned(
              top: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 6),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                            color: AppColors.aquaGreen,
                            shape: BoxShape.circle)),
                    const SizedBox(width: 5),
                    const Text('Ubicación fijada',
                        style: TextStyle(
                            fontSize: 11,
                            color: AppColors.aquaGreen,
                            fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTagSelector() {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: _tags.map((tag) {
        final selected = _selectedTag == tag['label'];
        return GestureDetector(
          onTap: () => setState(() => _selectedTag = tag['label']),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: selected ? AppColors.primaryBlue : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: selected
                    ? AppColors.primaryBlue
                    : Colors.grey.shade300,
              ),
              boxShadow: selected
                  ? [
                      BoxShadow(
                          color: AppColors.primaryBlue.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 3))
                    ]
                  : [],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(tag['icon'] as IconData,
                    color: selected ? Colors.white : Colors.grey[600],
                    size: 18),
                const SizedBox(width: 8),
                Text(
                  tag['label'] as String,
                  style: TextStyle(
                    color: selected ? Colors.white : Colors.grey[700],
                    fontWeight: selected
                        ? FontWeight.w600
                        : FontWeight.normal,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildConfirmButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.aquaGreen,
          foregroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 4,
          shadowColor: AppColors.aquaGreen.withValues(alpha: 0.4),
        ),
        icon: _isLoading 
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Icon(Icons.save),
        label: Text(
          _isLoading ? 'Guardando...' : 'Guardar Cambios',
          style: GoogleFonts.poppins(
              fontSize: 16, fontWeight: FontWeight.w600),
        ),
        onPressed: _isLoading ? null : () async {
          if (_selectedLocation == null) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Por favor busca y selecciona una dirección válida en el mapa')),
            );
            return;
          }
          if (_selectedTag == null) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Por favor selecciona una etiqueta para tu domicilio')),
            );
            return;
          }
          if (_searchController.text.isEmpty) {
             ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Por favor ingresa tu calle o referencia')),
            );
            return;
          }

          setState(() => _isLoading = true);
          try {
            final user = Supabase.instance.client.auth.currentUser;
            if (user != null) {
              final payload = {
                'usuario_id': user.id,
                'alias': _selectedTag,
                'calle': _searchController.text, 
                'latitud': _selectedLocation!.latitude,
                'longitud': _selectedLocation!.longitude,
                'tipo': _selectedTag == 'Trabajo' ? 'trabajo' : (_selectedTag == 'Otro' ? 'otro' : 'casa'),
              };

              if (_existingId != null) {
                await Supabase.instance.client.from('domicilios_usuario').update(payload).eq('id', _existingId!);
              } else {
                await Supabase.instance.client.from('domicilios_usuario').insert(payload);
              }
              
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Domicilio actualizado correctamente'), backgroundColor: AppColors.aquaGreen),
                );
                Navigator.pop(context, true); // true indica que sí se guardó para refrescar Perfil
              }
            } else {
               throw Exception('No hay usuario autenticado');
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Error al guardar domicilio: $e'), backgroundColor: Colors.red),
              );
            }
          } finally {
            if (mounted) setState(() => _isLoading = false);
          }
        },
      ),
    );
  }
}
