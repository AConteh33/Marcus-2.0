# Company Logo Setup Guide for Marcus

## 🎯 Overview
This guide helps you integrate your company logo into the Marcus application, including the app interface, Electron app icon, and installer icons.

## 📁 Logo Files Required

### **1. Main Logo** (`/public/logo.png`)
- **Format**: PNG
- **Size**: 512x512px (recommended)
- **Background**: Transparent
- **Usage**: App interface, web display
- **Location**: `/public/logo.png`

### **2. App Icon** (`/public/icon.png`)
- **Format**: PNG
- **Size**: 512x512px minimum
- **Background**: Transparent
- **Usage**: Linux app icon, fallback
- **Location**: `/public/icon.png`

### **3. Windows Icon** (`/public/icon.ico`)
- **Format**: ICO
- **Sizes**: 16x16, 32x32, 48x48, 256x256
- **Usage**: Windows app icon, installer
- **Location**: `/public/icon.ico`

### **4. macOS Icon** (`/public/icon.icns`)
- **Format**: ICNS
- **Sizes**: 16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024
- **Usage**: macOS app icon, dock
- **Location**: `/public/icon.icns`

## 🛠️ Setup Instructions

### **Step 1: Prepare Your Logo**

#### **Design Requirements**
- **High Resolution**: Start with 1024x1024px or higher
- **Vector Preferred**: SVG or high-res PNG
- **Simple Design**: Works well at small sizes
- **Good Contrast**: Visible on dark/light backgrounds
- **Brand Colors**: Use your company brand colors

#### **File Creation**
1. **Create Base Logo**: Design your logo in 1024x1024px
2. **Export to PNG**: Save as high-quality PNG with transparency
3. **Create Variants**: Generate different sizes and formats

### **Step 2: Convert to Required Formats**

#### **Online Converters**
- **ICO Converter**: https://convertico.com/
- **ICNS Converter**: https://iconverticons.com/online/
- **Multi-format**: https://cloudconvert.com/

#### **Command Line Tools**
```bash
# Using ImageMagick (install with brew install imagemagick)
convert logo.png -resize 512x512 icon.png
convert logo.png -define icon:auto-resize=256,48,32,16 icon.ico
```

#### **macOS Icon Tool**
```bash
# Create iconset folder
mkdir logo.iconset
# Copy different sizes
cp logo_16x16.png logo.iconset/icon_16x16.png
cp logo_32x32.png logo.iconset/icon_16x16@2x.png
cp logo_128x128.png logo.iconset/icon_128x128.png
cp logo_256x256.png logo.iconset/icon_128x128@2x.png
cp logo_512x512.png logo.iconset/icon_256x256@2x.png
cp logo_1024x1024.png logo.iconset/icon_512x512@2x.png
# Convert to ICNS
iconutil -c icns logo.iconset
```

### **Step 3: Replace Placeholder Files**

#### **Replace Logo Files**
```bash
# Replace with your actual logo files
cp your-logo.png /Users/ace/CascadeProjects/Marcus\ 1.9/public/logo.png
cp your-icon.png /Users/ace/CascadeProjects/Marcus\ 1.9/public/icon.png
cp your-icon.ico /Users/ace/CascadeProjects/Marcus\ 1.9/public/icon.ico
cp your-icon.icns /Users/ace/CascadeProjects/Marcus\ 1.9/public/icon.icns
```

#### **Verify Files**
```bash
# Check files exist and have correct permissions
ls -la /Users/ace/CascadeProjects/Marcus\ 1.9/public/
```

### **Step 4: Update App Configuration**

#### **Package.json Configuration**
The build configuration is already set up to use your logo files:

```json
{
  "build": {
    "extraResources": [
      {
        "from": "public/logo.png",
        "to": "logo.png"
      }
    ],
    "mac": {
      "icon": "public/icon.icns"
    },
    "win": {
      "icon": "public/icon.ico"
    },
    "linux": {
      "icon": "public/icon.png"
    }
  }
}
```

#### **App Icon in Main Window**
The Electron app is configured to use the icon:

```typescript
// In electron/main.ts
mainWindow = new BrowserWindow({
  icon: join(__dirname, '../public/icon.png'),
  // ... other options
});
```

## 🎨 Logo Integration Points

### **1. App Interface**
- **Header**: Company logo in top-left corner
- **Landing Page**: Large logo with company name
- **Component**: `CompanyLogo` component for reuse

### **2. Electron App**
- **Window Icon**: App icon in window title bar
- **Dock/Taskbar**: Icon in dock (macOS) or taskbar (Windows)
- **Alt+Tab**: Icon when switching applications

### **3. Installer Icons**
- **Windows Installer**: Custom icon in installer and shortcuts
- **macOS App**: Icon in Applications folder and dock
- **Linux AppImage**: Icon in application launcher

## 📱 Logo Component Usage

### **CompanyLogo Component**
```typescript
import { CompanyLogo } from './components/CompanyLogo';

// Different sizes
<CompanyLogo size="small" />
<CompanyLogo size="medium" />
<CompanyLogo size="large" />

// With text
<CompanyLogo size="medium" showText={true} />

// Custom styling
<CompanyLogo size="medium" className="custom-class" />
```

### **Size Specifications**
- **Small**: 32x32px (w-8 h-8)
- **Medium**: 48x48px (w-12 h-12)
- **Large**: 64x64px (w-16 h-16)

## 🧪 Testing Your Logo

### **Development Testing**
```bash
# Start development server
npm run electron:dev

# Check logo appears in:
# - App header (top-left)
# - Landing page
# - Window title bar
```

### **Production Testing**
```bash
# Build application
npm run electron:build -- --win

# Test built application
# Check logo in:
# - Installer icon
# - Desktop shortcut
# - Running application
```

## 🔧 Troubleshooting

### **Common Issues**

#### **Logo Not Showing**
- **Check File Path**: Verify files are in `/public/` directory
- **File Format**: Ensure correct format (PNG, ICO, ICNS)
- **File Size**: Check file isn't corrupted
- **Permissions**: Ensure files are readable

#### **Icon Not Working**
- **Format Issues**: Use proper converter tools
- **Size Requirements**: Include all required sizes
- **Transparency**: Some formats don't support transparency
- **Cache**: Clear build cache and rebuild

#### **Build Issues**
- **Clean Build**: Delete `release/` and `dist/` folders
- **Rebuild**: Run `npm run electron:build` again
- **Check Logs**: Review build output for errors

### **Debug Steps**
```bash
# 1. Verify files exist
ls -la public/logo.png public/icon.*

# 2. Check file formats
file public/icon.png public/icon.ico public/icon.icns

# 3. Clean build
rm -rf release/ dist/
npm run electron:build

# 4. Test development
npm run electron:dev
```

## 📋 Best Practices

### **Design Guidelines**
- **Simplicity**: Keep design simple and recognizable
- **Scalability**: Ensure logo works at 16x16px and 1024x1024px
- **Contrast**: Good contrast on both light and dark backgrounds
- **Consistency**: Use consistent colors and styling

### **Technical Guidelines**
- **File Size**: Keep files under 1MB for faster loading
- **Format Optimization**: Use optimized PNG/ICO/ICNS files
- **Fallbacks**: Provide fallback for missing formats
- **Testing**: Test on all target platforms

### **Brand Guidelines**
- **Color Palette**: Use official brand colors
- **Typography**: Use brand fonts if applicable
- **Spacing**: Maintain consistent spacing around logo
- **Usage Rights**: Ensure you have rights to use the logo

## 🎉 Complete Setup Checklist

### **Files Prepared**
- [ ] `public/logo.png` (512x512px, transparent)
- [ ] `public/icon.png` (512x512px, transparent)
- [ ] `public/icon.ico` (multi-size ICO)
- [ ] `public/icon.icns` (multi-size ICNS)

### **Configuration Updated**
- [ ] Package.json build configuration
- [ ] Electron main.ts icon setting
- [ ] CompanyLogo component imported

### **Testing Complete**
- [ ] Development mode shows logo
- [ ] Production build includes logo
- [ ] Installer has custom icon
- [ ] All platforms display correctly

---

**Your company logo is now integrated into Marcus!** 🚀✨

## 📞 Need Help?

- **Design Issues**: Consult your brand guidelines
- **Technical Issues**: Check file formats and paths
- **Build Issues**: Clean and rebuild the application
- **Platform Issues**: Test on target operating systems
