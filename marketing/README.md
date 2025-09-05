# Tennis Club RT2 Marketing Site

A modern, responsive marketing/landing page to introduce users to the new Tennis Club RT2 court reservation system.

## 🎯 Purpose

This marketing site serves as a transition page to help users move from the old tennis club system to the new Tennis Club RT2 application. It highlights the improvements, features, and benefits of the new system while providing easy access to the app.

## 📁 Structure

```
marketing/
├── index.html              # Main landing page
├── assets/
│   ├── css/
│   │   └── style.css       # Modern styling with design system
│   ├── js/
│   │   └── main.js         # Interactive functionality
│   └── images/
│       └── favicon.ico     # Site icon
└── README.md               # This file
```

## 🎨 Design Features

- **Modern Glassmorphism Design**: Following the Tennis Club RT2 design system
- **Mobile-First Responsive**: Optimized for all devices (mobile, tablet, desktop)
- **Senior-Friendly UI**: Large fonts, high contrast, clear navigation
- **Professional Blue Theme**: Matching the main application's color scheme
- **Interactive Elements**: Smooth animations, hover effects, and transitions

## 📱 Sections

1. **Hero Section**: Eye-catching introduction with call-to-action
2. **Features Grid**: Key benefits and improvements of the new system
3. **Comparison Table**: Old system vs. new system comparison
4. **Getting Started**: 3-step guide to transition to the new app
5. **FAQ Section**: Common questions with expandable answers
6. **Call-to-Action**: Direct links to access the new application
7. **Footer**: Additional links and contact information

## 🚀 Deployment Options

### Option 1: Standalone Deployment
Deploy as a separate static site on any web hosting service:

```bash
# Copy the entire marketing folder to your web server
cp -r marketing/ /var/www/html/landing/
```

### Option 2: Netlify Integration
Add to your existing `netlify.toml`:

```toml
[[redirects]]
  from = "/landing/*"
  to = "/marketing/:splat"
  status = 200
```

### Option 3: Express.js Integration
Serve from your backend as static files:

```javascript
// In your Express.js app
app.use('/landing', express.static('marketing'));
```

### Option 4: Subdomain
Point a subdomain (e.g., `welcome.tennisclubrt2.com`) to the marketing folder.

## 🔧 Customization

### Content Updates
Edit `index.html` to update:
- Club name and branding
- Contact information
- Feature descriptions
- FAQ content

### Styling Changes
Modify `assets/css/style.css` to adjust:
- Colors and branding
- Typography
- Layout and spacing
- Responsive breakpoints

### Functionality
Update `assets/js/main.js` for:
- Interactive features
- Form handling
- Analytics integration
- Custom animations

## 📊 Key Metrics to Track

Consider adding analytics to track:
- Page views and bounce rate
- Time spent on page
- Click-through rate to main app
- Most viewed sections
- Mobile vs. desktop usage

## 🎨 Color Scheme

The site uses the Tennis Club RT2 design system colors:

```css
/* Primary Colors */
--primary-gradient: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #2563eb 100%);
--background-gradient: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e0 100%);

/* Text Colors */
--text-primary: #1a202c;
--text-secondary: #4a5568;
--text-white: #ffffff;
```

## 🔒 Security Considerations

- All external links open in new tabs
- No user input collection (static site)
- XSS protection through CSP headers (if deployed with headers)
- HTTPS recommended for production

## 📱 Browser Support

- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Features**: CSS Grid, Flexbox, backdrop-filter, CSS custom properties

## 🛠️ Development

For local development:

```bash
# Serve with a simple HTTP server
python -m http.server 8000
# or
npx serve marketing/

# Then visit http://localhost:8000
```

## ✨ Future Enhancements

Consider adding:
- Member testimonials with photos
- App screenshots/video demos
- Multi-language support
- Dark mode toggle
- Newsletter signup
- Social media integration
- Live chat widget

## 📞 Support

For questions about the marketing site:
- Edit content directly in HTML files
- Styling issues: Check CSS variables and media queries
- JavaScript errors: Check browser console
- Deployment: Follow your hosting provider's static site guidelines

---

**Built with modern web technologies for the modern tennis club.**