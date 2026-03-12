# Flutter Event Booking Theme (Material 3)

## Note
The provided website URL is `PASTE_MY_WEBSITE_URL_HERE`, so live UI color extraction is not possible yet.
This theme is designed as a professional red/white Material 3 palette for an Event Booking / Ticket Management app, aligned with your required light-mode constraints.

## 1) UI Color Analysis (Target Light Theme)

- Primary color: `#D32F2F` (Red 700)
- Secondary color: `#FF6B6B` (Soft coral red)
- Background color: `#FFFFFF` (White)
- Text primary: `#1C1B1F` (Near-black, Material neutral)
- Text secondary: `#49454F` (Muted gray)
- Button primary: `#D32F2F` with on-button text `#FFFFFF`
- Button secondary (tonal): `#FFE5E5` with text `#B71C1C`
- Accent color: `#FFB300` (Amber for highlights/CTAs/status)

## 2) Complete Color Palette Table

| Role | Hex | Suggested Use |
|---|---|---|
| Primary | `#D32F2F` | Brand identity, main CTAs, active states |
| On Primary | `#FFFFFF` | Text/icons on primary surfaces |
| Primary Container | `#FFCDD2` | Chips, selected filters, soft emphasis |
| On Primary Container | `#5F0000` | Text/icons on primary container |
| Secondary | `#FF6B6B` | Supporting actions, badges |
| On Secondary | `#FFFFFF` | Text/icons on secondary surfaces |
| Secondary Container | `#FFE5E5` | Info strips, secondary cards |
| On Secondary Container | `#6B1A1A` | Text/icons on secondary container |
| Tertiary (Accent) | `#FFB300` | Promo tags, urgency markers |
| On Tertiary | `#2A1800` | Text/icons on tertiary surfaces |
| Surface | `#FFFFFF` | Cards, sheets, dialogs |
| Surface Variant | `#F7F2F3` | Input backgrounds, grouped sections |
| Background | `#FFFFFF` | Main app background |
| Error | `#B3261E` | Validation and destructive feedback |
| On Error | `#FFFFFF` | Text/icons on error surfaces |
| Outline | `#7A757F` | Borders and dividers |
| Text Primary | `#1C1B1F` | Main readable text |
| Text Secondary | `#49454F` | Supporting text |
| AppBar | `#FFFFFF` | Clean top bars |
| Card | `#FFFFFF` | Elevated event cards |
| Success | `#2E7D32` | Booking success states |
| Warning | `#ED6C02` | Partial alerts |
| Info | `#0288D1` | Informational labels |

## 3) Flutter Color Constants (`app_colors.dart`)

```dart
import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Core brand colors
  static const Color primary = Color(0xFFD32F2F);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFFFFCDD2);
  static const Color onPrimaryContainer = Color(0xFF5F0000);

  static const Color secondary = Color(0xFFFF6B6B);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFFFE5E5);
  static const Color onSecondaryContainer = Color(0xFF6B1A1A);

  static const Color tertiary = Color(0xFFFFB300);
  static const Color onTertiary = Color(0xFF2A1800);

  // Neutrals and surfaces
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF7F2F3);
  static const Color outline = Color(0xFF7A757F);

  // Typography
  static const Color textPrimary = Color(0xFF1C1B1F);
  static const Color textSecondary = Color(0xFF49454F);

  // Feedback colors
  static const Color error = Color(0xFFB3261E);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color success = Color(0xFF2E7D32);
  static const Color warning = Color(0xFFED6C02);
  static const Color info = Color(0xFF0288D1);

  // Component-specific colors
  static const Color appBar = Color(0xFFFFFFFF);
  static const Color card = Color(0xFFFFFFFF);
  static const Color buttonPrimary = primary;
  static const Color buttonSecondary = secondaryContainer;
}
```

## 4) Flutter ThemeData (Material 3) (`app_theme.dart`)

```dart
import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final colorScheme = const ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.primary,
      onPrimary: AppColors.onPrimary,
      primaryContainer: AppColors.primaryContainer,
      onPrimaryContainer: AppColors.onPrimaryContainer,
      secondary: AppColors.secondary,
      onSecondary: AppColors.onSecondary,
      secondaryContainer: AppColors.secondaryContainer,
      onSecondaryContainer: AppColors.onSecondaryContainer,
      tertiary: AppColors.tertiary,
      onTertiary: AppColors.onTertiary,
      error: AppColors.error,
      onError: AppColors.onError,
      surface: AppColors.surface,
      onSurface: AppColors.textPrimary,
      onSurfaceVariant: AppColors.textSecondary,
      outline: AppColors.outline,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.background,

      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.appBar,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: false,
      ),

      cardTheme: CardThemeData(
        color: AppColors.card,
        elevation: 1.5,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.buttonPrimary,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary),
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),

      dividerTheme: const DividerThemeData(
        color: AppColors.outline,
        thickness: 0.4,
      ),

      textTheme: const TextTheme(
        headlineSmall: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
        titleLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
        titleMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: AppColors.textPrimary),
        bodyMedium: TextStyle(color: AppColors.textSecondary),
        labelLarge: TextStyle(color: AppColors.onPrimary, fontWeight: FontWeight.w600),
      ),
    );
  }
}
```

## 5) Example Usage in Flutter App (`main.dart`)

```dart
import 'package:flutter/material.dart';
import 'app_theme.dart';

void main() {
  runApp(const EventApp());
}

class EventApp extends StatelessWidget {
  const EventApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Event Booking',
      theme: AppTheme.light,
      home: const LoginScreen(),
    );
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Welcome Back')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 12),
            TextField(
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {},
              child: const Text('Sign In'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## 6) Suggested UI Styling (Event App)

### Login Screen
- Keep background pure white with generous spacing and one strong red CTA.
- Use subtle `surfaceVariant` on input fields for depth without visual noise.
- Add secondary text for help links in `textSecondary` for hierarchy.

### Event Cards
- Use white cards with 16px radius and soft elevation.
- Highlight date/time badges with `primaryContainer` and readable dark text.
- Use accent (`tertiary`) for limited tags like `Hot`, `Limited Seats`, `Early Bird`.

### Buttons
- Primary actions: filled red (`primary`) with white text.
- Secondary actions: outlined red or tonal (`secondaryContainer`) variant.
- Keep minimum 48-52px button height for touch accessibility.

## 7) Quick Mapping You Requested

- Primary color: `#D32F2F`
- Secondary color: `#FF6B6B`
- Surface color: `#FFFFFF`
- Error color: `#B3261E`
- Text primary: `#1C1B1F`
- Text secondary: `#49454F`
- Button colors: Primary `#D32F2F`, Secondary `#FFE5E5`
- AppBar color: `#FFFFFF`
- Card color: `#FFFFFF`

## 8) Accessibility Notes

- Primary red on white has strong visual prominence; keep body text in near-black for AA readability.
- Avoid long paragraphs in pure red text.
- For disabled states, reduce opacity and maintain sufficient contrast for icons.

## 9) If you share the real website URL

I can produce a second version with exact extracted brand hex values (from CSS, gradients, and key components) and map it directly to Material 3 `ColorScheme` tokens.
