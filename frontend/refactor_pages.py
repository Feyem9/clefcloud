import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Apply Design Tokens Replacements:
    replacements = [
        # Removing borders
        (r'border border-[a-z]+-\d+ dark:border-gray-\d+', ''),
        (r'border\s+border-gray-\d+\s+dark:border-gray-\d+', ''),
        (r'border-b\s+border-gray-\d+\s+dark:border-gray-\d+', 'bg-surface-container-low'),
        (r'border-t\s+border-gray-\d+\s+dark:border-gray-\d+', 'bg-surface-container-low'),

        # Surface layers
        (r'bg-white dark:bg-gray-800', 'bg-surface-container-lowest shadow-ambient'),
        (r'bg-gray-50 dark:bg-gray-900', 'bg-surface'),
        (r'bg-[a-z]+-50 dark:bg-gray-800', 'bg-surface-container-high'), # Catch cyan-50, blue-50, green-50
        (r'bg-gray-100 dark:bg-gray-800', 'bg-surface-container-low'),
        (r'bg-gray-200 dark:bg-gray-700', 'bg-surface-variant'),
        
        # Shadows
        (r'shadow-(?:sm|md|lg|xl|2xl)', 'shadow-ambient'),
        
        # Text colors
        (r'text-gray-900 dark:text-white', 'text-on-surface font-display'),
        (r'text-gray-800 dark:text-white', 'text-on-surface font-display'),
        (r'text-gray-800 dark:text-gray-200', 'text-on-surface'),
        (r'text-gray-700 dark:text-gray-300', 'text-on-surface-variant'),
        (r'text-gray-600 dark:text-gray-400', 'text-on-surface-variant'),
        (r'text-gray-500 dark:text-gray-400', 'text-outline-variant'),
        
        # Primary Buttons & Accents
        (r'text-blue-600 dark:text-blue-400', 'text-primary'),
        (r'bg-blue-600 hover:bg-blue-700', 'bg-gradient-to-br from-primary to-primary-container text-on-primary hover:opacity-90 transition-all'),
        (r'bg-primary-600 hover:bg-primary-700', 'bg-gradient-to-br from-primary to-primary-container text-on-primary hover:opacity-90 transition-all'),
        (r'bg-primary-700 hover:bg-primary-800', 'bg-gradient-to-br from-primary to-primary-container text-on-primary hover:opacity-90 transition-all'),
        (r'text-primary-600 dark:text-primary-400', 'text-primary'),
        (r'text-primary-700 dark:text-primary-400', 'text-primary'),
        (r'text-primary-600', 'text-primary'),
        (r'text-primary-700', 'text-primary-container'),
        
        # Specific color cards mapping to layers
        (r'bg-yellow-50 dark:bg-gray-800', 'bg-surface-container-highest'),
        (r'bg-primary-100 dark:bg-gray-800', 'bg-surface-container-low'),
        (r'text-amber-600 dark:text-amber-400', 'text-tertiary'),
        (r'text-yellow-700 dark:text-yellow-500', 'text-tertiary'),
        
        # Specific overrides for the buttons and headers
        (r'rounded-lg', 'rounded-xl'),
        (r'rounded-md', 'rounded-xl'),
        
        # Inputs focus
        (r'focus:ring-2 focus:ring-primary-500', 'focus:ring-2 focus:ring-primary border-transparent focus:bg-surface-container-lowest'),
        (r'focus:border-primary-500', 'focus:border-primary border-transparent'),
    ]

    new_content = content
    for pattern, replacement in replacements:
        new_content = re.sub(pattern, replacement, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

pages_dir = '/home/christian/Bureau/CHRISTIAN/ClefCloud/frontend/src/pages'
for filepath in glob.glob(os.path.join(pages_dir, '*.jsx')):
    process_file(filepath)
