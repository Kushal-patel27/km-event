# K&M Events -> Flutter Theme Code (Based on Current Project)

## What was analyzed
Colors were extracted from your current frontend sources and docs:
- `THEME_COLOR_GUIDE.md`
- `HOME_PAGE_THEME_UPDATE.md`
- `Frontend-EZ/src/index.css`
- Tailwind usage across `Frontend-EZ/src/components/**`

Your web UI uses a **navy + red** brand system with glass effects, plus neutral grays.

## Extracted Color Palette

| Role | Hex | Source Pattern |
|---|---|---|
| Brand Navy (primary dark bg) | `#0B0F19` | Theme docs (`from-[#0B0F19]`) |
| Brand Navy 2 (secondary dark bg) | `#0D1221` | Theme docs (`to-[#0d1221]`) |
| Brand Red | `#EF4444` | `red-500` usage |
| Brand Red Strong | `#DC2626` | `red-600` usage |
| Light Background | `#FFFFFF` | Light surfaces / cards |
| Light Surface Alt | `#F8FAFC` | sky/slate-like light gradients |
| Text Primary Dark UI | `#FFFFFF` | Dark homepage text |
| Text Secondary Dark UI | `#D1D5DB` | `gray-300` |
| Text Primary Light UI | `#111827` | `gray-900` |
| Text Secondary Light UI | `#4B5563` | `gray-600` |
| Border/Subtle | `#E5E7EB` | `gray-200` |
| Error | `#B3261E` | Material error baseline |
| Success | `#16A34A` | semantic success |
| Info | `#2563EB` | blue info/links |

## Flutter Adaptation Strategy

- **Light Mode (required):** Red primary + white background.
- **Dark Mode (brand mode):** Navy background + red accent to match your current website hero/home style.
- **Material 3:** Use `ColorScheme`, component themes, and semantic colors.

---

## 1) Flutter Color Constants (`lib/theme/app_colors.dart`)

```dart
import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Brand colors from current project
  static const Color navy900 = Color(0xFF0B0F19);
  static const Color navy800 = Color(0xFF0D1221);
  static const Color red500 = Color(0xFFEF4444);
  static const Color red600 = Color(0xFFDC2626);

  // Light palette
  static const Color white = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceAltLight = Color(0xFFF8FAFC);
  static const Color textPrimaryLight = Color(0xFF111827);
  static const Color textSecondaryLight = Color(0xFF4B5563);
  static const Color borderLight = Color(0xFFE5E7EB);

  // Dark palette
  static const Color surfaceDark = Color(0xFF0D1221);
  static const Color backgroundDark = Color(0xFF0B0F19);
  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textSecondaryDark = Color(0xFFD1D5DB);
  static const Color borderDark = Color(0x33FFFFFF); // white/20

  // Semantic
  static const Color error = Color(0xFFB3261E);
  static const Color success = Color(0xFF16A34A);
  static const Color info = Color(0xFF2563EB);
  static const Color warning = Color(0xFFED6C02);
}
```

## 2) Flutter ThemeData (Material 3) (`lib/theme/app_theme.dart`)

```dart
import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData light() {
    // Required: primary red + white background
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.red600,
      onPrimary: AppColors.white,
      primaryContainer: Color(0xFFFEE2E2),
      onPrimaryContainer: Color(0xFF7F1D1D),
      secondary: AppColors.red500,
      onSecondary: AppColors.white,
      secondaryContainer: Color(0xFFFFE4E6),
      onSecondaryContainer: Color(0xFF881337),
      tertiary: AppColors.info,
      onTertiary: AppColors.white,
      error: AppColors.error,
      onError: AppColors.white,
      surface: AppColors.surfaceLight,
      onSurface: AppColors.textPrimaryLight,
      onSurfaceVariant: AppColors.textSecondaryLight,
      outline: AppColors.borderLight,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.white,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.textPrimaryLight,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: AppColors.white,
        elevation: 1,
        shadowColor: Colors.black12,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.red600,
          foregroundColor: AppColors.white,
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.red600,
          side: const BorderSide(color: AppColors.red600),
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceAltLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.red600, width: 1.4),
        ),
      ),
    );
  }

  static ThemeData dark() {
    // Optional: aligns with existing web homepage brand style
    const scheme = ColorScheme(
      brightness: Brightness.dark,
      primary: AppColors.red500,
      onPrimary: AppColors.white,
      primaryContainer: Color(0xFF7F1D1D),
      onPrimaryContainer: Color(0xFFFEE2E2),
      secondary: Color(0xFF94A3B8),
      onSecondary: Color(0xFF0B0F19),
      secondaryContainer: Color(0xFF1F2937),
      onSecondaryContainer: AppColors.textPrimaryDark,
      tertiary: AppColors.info,
      onTertiary: AppColors.white,
      error: AppColors.error,
      onError: AppColors.white,
      surface: AppColors.surfaceDark,
      onSurface: AppColors.textPrimaryDark,
      onSurfaceVariant: AppColors.textSecondaryDark,
      outline: AppColors.borderDark,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.backgroundDark,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.backgroundDark,
        foregroundColor: AppColors.textPrimaryDark,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: const Color(0xFF1A1F2E),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
```

## 3) Example Usage (`lib/main.dart`)

```dart
import 'package:flutter/material.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const KmEventApp());
}

class KmEventApp extends StatelessWidget {
  const KmEventApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'K&M Events',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      home: const DemoScreen(),
    );
  }
}

class DemoScreen extends StatelessWidget {
  const DemoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Event Booking')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Sunburn Arena Night', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text('Mumbai • 24 Mar • 7:00 PM', style: TextStyle(color: cs.onSurfaceVariant)),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: () {}, child: const Text('Book Tickets')),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: () {}, child: const Text('View Details')),
        ],
      ),
    );
  }
}
```

## 4) Suggested Token Mapping (for your app screens)

- Primary color: `#DC2626`
- Secondary color: `#EF4444`
- Surface color: `#FFFFFF` (light), `#0D1221` (dark)
- Error color: `#B3261E`
- Text primary: `#111827` (light), `#FFFFFF` (dark)
- Text secondary: `#4B5563` (light), `#D1D5DB` (dark)
- Button colors: Filled `#DC2626`, Outlined text/border `#DC2626`
- AppBar color: `#FFFFFF` (light), `#0B0F19` (dark)
- Card color: `#FFFFFF` (light), `#1A1F2E` (dark)

## 5) UI Notes for Event Booking App

- Login screen: white background, one strong red CTA, subtle gray input fills.
- Event cards: 16px radius, compact metadata rows, red price/CTA highlight.
- Buttons: primary filled red, secondary outlined red, consistent 50px height.
- Dark mode: navy surfaces with red accents to preserve your current brand identity.

---

If you want, I can now convert this into actual Flutter files directly in a `lib/theme/` folder structure (not just markdown) so you can paste less and run immediately.
