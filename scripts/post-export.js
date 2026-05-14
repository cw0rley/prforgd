const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const pwaTags = `
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="PRForgd" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icon-192.png" />`;

// Insert before </head>
html = html.replace('</head>', pwaTags + '\n</head>');

fs.writeFileSync(indexPath, html);
console.log('PWA tags injected into index.html');

// Flatten font files out of node_modules path (Vercel ignores node_modules)
const distDir = path.join(__dirname, '..', 'dist');
const fontsSource = path.join(distDir, 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
const fontsDest = path.join(distDir, 'assets', 'fonts');

if (fs.existsSync(fontsSource)) {
  fs.mkdirSync(fontsDest, { recursive: true });
  const fonts = fs.readdirSync(fontsSource);
  for (const font of fonts) {
    fs.copyFileSync(path.join(fontsSource, font), path.join(fontsDest, font));
  }
  console.log(`Copied ${fonts.length} font files to assets/fonts/`);

  // Update JS bundle to reference new path
  const jsDir = path.join(distDir, '_expo', 'static', 'js', 'web');
  const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
  for (const jsFile of jsFiles) {
    const jsPath = path.join(jsDir, jsFile);
    let js = fs.readFileSync(jsPath, 'utf8');
    const oldPath = 'assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/';
    if (js.includes(oldPath)) {
      js = js.split(oldPath).join('assets/fonts/');
      fs.writeFileSync(jsPath, js);
      console.log(`Updated font paths in ${jsFile}`);
    }
  }

  // Remove the old deep path
  fs.rmSync(path.join(distDir, 'assets', 'node_modules'), { recursive: true, force: true });
  console.log('Removed old node_modules font path');
}
