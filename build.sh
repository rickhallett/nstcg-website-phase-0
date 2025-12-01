#!/bin/bash

# Build script for minifying CSS and JS files
# Uses npx to run minifiers without requiring npm install

set -e

echo "Building minified assets..."

# Create dist and temp directories
mkdir -p dist
mkdir -p .tmp

# CSS Files in correct order (excluding main.css as it only has @imports)
CSS_FILES=(
    "css/base/variables.css"
    "css/base/reset.css"
    "css/base/typography.css"
    "css/base/animations.css"
    "css/layout/container.css"
    "css/layout/header.css"
    "css/layout/footer.css"
    "css/components/navigation.css"
    "css/components/hero.css"
    "css/components/impact-map.css"
    "css/components/counter.css"
    "css/components/live-feed.css"
    "css/components/thought-bubbles.css"
    "css/components/forms.css"
    "css/components/confirmation.css"
    "css/components/social-proof.css"
    "css/components/gamification.css"
    "css/components/survey.css"
    "css/components/share-buttons.css"
    "css/components/toast.css"
    "css/components/modal.css"
    "css/components/messages.css"
    "css/components/financial-card.css"
    "css/pages/feeds.css"
    "css/utilities/helpers.css"
    "css/utilities/registration-state.css"
    "css/utilities/mobile.css"
)

# JS Files
JS_FILES=(
    "js/data-loader.js"
    "js/homepage-static.js"
    "js/feeds-static.js"
    "js/share-static.js"
)

# Concatenate CSS files
echo "Concatenating CSS..."
> .tmp/styles.css
for file in "${CSS_FILES[@]}"; do
    if [ -f "$file" ]; then
        cat "$file" >> .tmp/styles.css
    fi
done

# Concatenate JS files
echo "Concatenating JS..."
> .tmp/app.js
for file in "${JS_FILES[@]}"; do
    if [ -f "$file" ]; then
        cat "$file" >> .tmp/app.js
    fi
done

# Minify CSS using clean-css-cli (no source maps)
echo "Minifying CSS with clean-css..."
npx clean-css-cli -o dist/styles.min.css .tmp/styles.css --with-rebase

# Minify and uglify JS using terser with aggressive options (no source maps)
echo "Minifying and uglifying JS with terser..."
npx terser .tmp/app.js -o dist/app.min.js \
  --compress passes=3,drop_console=true,drop_debugger=true,pure_funcs=['console.log','console.info','console.debug'],unsafe=true,unsafe_comps=true,unsafe_math=true,unsafe_methods=true,unsafe_proto=true,unsafe_regexp=true,unsafe_undefined=true \
  --mangle toplevel=true,eval=true \
  --format ascii_only=true,comments=false \
  --source-map false

# Clean up temp files
rm -rf .tmp

# Get file sizes
CSS_SIZE=$(wc -c < dist/styles.min.css | tr -d ' ')
JS_SIZE=$(wc -c < dist/app.min.js | tr -d ' ')

echo "Build complete!"
echo "   CSS: ${CSS_SIZE} bytes"
echo "   JS:  ${JS_SIZE} bytes"
