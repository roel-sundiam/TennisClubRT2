const fs = require('fs-extra');
const path = require('path');

console.log('🎾 Tennis Club RT2 - Simple Showcase Generation');
console.log('==============================================');

async function generateShowcase() {
  try {
    console.log('\n🌐 Creating Interactive Web Showcase...');
    
    // Create output directories
    await fs.ensureDir('showcase-web');
    await fs.ensureDir('showcase-web/assets/css');
    await fs.ensureDir('showcase-web/assets/js');
    await fs.ensureDir('showcase-web/assets/images');
    
    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tennis Club RT2 - Feature Showcase</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            line-height: 1.6;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 2rem; 
        }
        .hero { 
            text-align: center; 
            padding: 4rem 0; 
        }
        .hero h1 { 
            font-size: 3rem; 
            margin-bottom: 1rem; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .hero p { 
            font-size: 1.2rem; 
            margin-bottom: 2rem; 
            opacity: 0.9;
        }
        .features { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 2rem; 
            margin: 3rem 0; 
        }
        .feature {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 2rem;
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }
        .feature:hover {
            transform: translateY(-5px);
        }
        .feature h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #4caf50;
        }
        .stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin: 3rem 0;
            flex-wrap: wrap;
        }
        .stat {
            text-align: center;
        }
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #4caf50;
            display: block;
        }
        .cta {
            text-align: center;
            margin: 4rem 0;
        }
        .btn {
            display: inline-block;
            padding: 1rem 2rem;
            background: #4caf50;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 0 1rem;
            transition: background 0.3s ease;
        }
        .btn:hover {
            background: #45a049;
        }
        .tech-specs {
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 2rem;
            margin: 2rem 0;
        }
        .tech-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        .tech-item h4 {
            color: #4caf50;
            margin-bottom: 1rem;
        }
        .tech-item ul {
            list-style: none;
            padding: 0;
        }
        .tech-item li {
            padding: 0.25rem 0;
            padding-left: 1rem;
            position: relative;
        }
        .tech-item li:before {
            content: "✓";
            color: #4caf50;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        @media (max-width: 768px) {
            .hero h1 { font-size: 2rem; }
            .stats { gap: 1rem; }
            .features { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>🎾 Rich Town 2 Tennis Club</h1>
            <p>Complete Tennis Club Management System</p>
            <div class="stats">
                <div class="stat">
                    <span class="stat-number">30+</span>
                    <span>Features</span>
                </div>
                <div class="stat">
                    <span class="stat-number">PWA</span>
                    <span>Enabled</span>
                </div>
                <div class="stat">
                    <span class="stat-number">3</span>
                    <span>User Roles</span>
                </div>
            </div>
        </div>

        <div class="features">
            <div class="feature">
                <h3>📅 Smart Court Reservations</h3>
                <p>Dynamic pricing system with peak/off-peak hours. Weather integration helps members make informed booking decisions.</p>
                <ul>
                    <li>✓ Peak hour pricing (₱100 fixed)</li>
                    <li>✓ Off-peak pricing (₱20 per player)</li>
                    <li>✓ Real-time weather data</li>
                </ul>
            </div>

            <div class="feature">
                <h3>🏆 Automated Open Play</h3>
                <p>Unique tournament system that creates fair doubles matches automatically. Vote-based participation with smart algorithms.</p>
                <ul>
                    <li>✓ Automated match generation</li>
                    <li>✓ Fair player rotation</li>
                    <li>✓ Vote-based participation</li>
                </ul>
            </div>

            <div class="feature">
                <h3>🪙 Dual Currency System</h3>
                <p>Innovative coin economy based on page visits plus traditional credit system for reservations.</p>
                <ul>
                    <li>✓ Page visit coin rewards</li>
                    <li>✓ Prepaid credit system</li>
                    <li>✓ Admin coin management</li>
                </ul>
            </div>

            <div class="feature">
                <h3>👥 Community Features</h3>
                <p>Member directory, player rankings, polls, and feedback system to build a strong tennis community.</p>
                <ul>
                    <li>✓ Member directory</li>
                    <li>✓ Player rankings & seeding</li>
                    <li>✓ Community polls & voting</li>
                </ul>
            </div>

            <div class="feature">
                <h3>👨‍💼 Admin Dashboard</h3>
                <p>Comprehensive member management with approval workflows, financial reports, and system analytics.</p>
                <ul>
                    <li>✓ Member approval system</li>
                    <li>✓ Financial reports</li>
                    <li>✓ System analytics</li>
                </ul>
            </div>

            <div class="feature">
                <h3>📱 Progressive Web App</h3>
                <p>Full PWA with offline support, push notifications, and installable app shortcuts for mobile devices.</p>
                <ul>
                    <li>✓ Offline functionality</li>
                    <li>✓ Push notifications</li>
                    <li>✓ Mobile app-like experience</li>
                </ul>
            </div>
        </div>

        <div class="tech-specs">
            <h2>🛠 Technical Specifications</h2>
            <div class="tech-grid">
                <div class="tech-item">
                    <h4>Frontend</h4>
                    <ul>
                        <li>Angular 20 (Standalone Components)</li>
                        <li>Angular Material Design</li>
                        <li>Progressive Web App</li>
                        <li>Responsive Design</li>
                        <li>Senior-Friendly UI</li>
                    </ul>
                </div>
                <div class="tech-item">
                    <h4>Backend</h4>
                    <ul>
                        <li>Express.js with TypeScript</li>
                        <li>MongoDB with Mongoose</li>
                        <li>JWT Authentication</li>
                        <li>Rate Limiting</li>
                        <li>OpenWeather API Integration</li>
                    </ul>
                </div>
                <div class="tech-item">
                    <h4>Key Features</h4>
                    <ul>
                        <li>Real-time Notifications</li>
                        <li>Multi-role Access Control</li>
                        <li>Payment Processing</li>
                        <li>Analytics Dashboard</li>
                        <li>Court Booking System</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="cta">
            <h2>🚀 Ready to Transform Your Tennis Club?</h2>
            <p>Experience the most comprehensive tennis club management system</p>
            <a href="#" class="btn" onclick="alert('Contact your development team for deployment!')">Get Started</a>
            <a href="https://github.com/your-repo" class="btn" style="background: rgba(255,255,255,0.2);">View Source</a>
        </div>

        <div style="text-align: center; margin: 3rem 0; padding: 2rem; background: rgba(0,0,0,0.2); border-radius: 12px;">
            <h3>🎾 Built for Rich Town 2 Tennis Club</h3>
            <p>Modern, accessible, and comprehensive tennis club management</p>
            <p><strong>Perfect for:</strong> Club administrators, members, and tennis enthusiasts</p>
        </div>
    </div>

    <script>
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Animate stats on scroll
            const stats = document.querySelectorAll('.stat-number');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animation = 'pulse 2s infinite';
                    }
                });
            });
            
            stats.forEach(stat => observer.observe(stat));
            
            // Add pulse animation
            const style = document.createElement('style');
            style.textContent = \`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            \`;
            document.head.appendChild(style);
            
            console.log('🎾 Tennis Club RT2 Showcase Loaded!');
        });
    </script>
</body>
</html>`;

    await fs.writeFile('showcase-web/index.html', html);
    
    console.log('✅ Interactive showcase created successfully!');
    console.log('📁 Output: showcase-web/index.html');
    console.log('');
    console.log('🌐 To view the showcase:');
    console.log('   1. Open showcase-web/index.html in your browser');
    console.log('   2. Or run: npm run serve');
    console.log('');
    console.log('🎉 Your Tennis Club RT2 showcase is ready!');
    
  } catch (error) {
    console.error('❌ Error creating showcase:', error.message);
  }
}

generateShowcase();